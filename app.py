from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import mysql.connector
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection
db = mysql.connector.connect(
    host=os.getenv("MYSQL_HOST", "localhost"),
    user=os.getenv("MYSQL_USER", "study_user"),
    password=os.getenv("MYSQL_PASSWORD", "1234"),
    database=os.getenv("MYSQL_DATABASE", "study_buddy")
)
cursor = db.cursor()

# Hugging Face API
HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "google/flan-t5-large")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}

# Serve HTML
@app.route("/")
def home():
    return render_template("index.html")

# Generate flashcards (AI-powered)
@app.route("/api/generate", methods=["POST"])
def generate_flashcards():
    data = request.json
    topic = data.get("topic")
    num_cards = int(data.get("numCards", 5))

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    # Strong AI prompt
    prompt = f"""You are a quiz generator. Read the following study notes carefully and generate {num_cards} quiz questions. 
Each question should test knowledge from the notes. 
Return the output in this exact format:
Q: [question text]
A: [answer text]

Notes:
{topic}"""

    try:
        response = requests.post(
            HF_API_URL,
            headers=HEADERS,
            json={"inputs": prompt},
            timeout=30
        )

        # Fallback if API fails
        if response.status_code != 200:
            flashcards = [
                {"question": f"Sample Q{i+1} about {topic}", "answer": f"Sample A{i+1}"}
                for i in range(num_cards)
            ]
            return jsonify({
                "flashcards": flashcards,
                "warning": "Hugging Face API failed; showing dummy flashcards"
            }), 200

        api_result = response.json()
        generated_text = api_result[0].get("generated_text", "")

        # Parse lines with Q/A
        flashcards = []
        for line in generated_text.split("\n"):
            line = line.strip()
            if line.startswith("Q:"):
                question = line[2:].strip()
                answer = ""
            elif line.startswith("A:") and flashcards:
                answer = line[2:].strip().lstrip("about ").strip()
                flashcards[-1]["answer"] = answer
            if line.startswith("Q:"):
                flashcards.append({"question": question, "answer": answer})

            if len(flashcards) >= num_cards:
                break

        # Fallback if API returns nothing
        if not flashcards:
            flashcards = [
                {"question": f"Sample Q{i+1} about {topic}", "answer": f"Sample A{i+1}"}
                for i in range(num_cards)
            ]

        return jsonify({"flashcards": flashcards})

    except Exception as e:
        flashcards = [
            {"question": f"Sample Q{i+1} about {topic}", "answer": f"Sample A{i+1}"}
            for i in range(num_cards)
        ]
        return jsonify({
            "flashcards": flashcards,
            "warning": f"Error: {str(e)}; showing dummy flashcards"
        }), 200

# Save flashcards to DB
@app.route("/api/flashcards/save", methods=["POST"])
def save_flashcards():
    data = request.json
    flashcards = data.get("flashcards", [])
    saved_ids = []

    for c in flashcards:
        cursor.execute(
            "INSERT INTO flashcards (question, answer) VALUES (%s, %s)",
            (c["question"], c["answer"])
        )
        db.commit()
        saved_ids.append(cursor.lastrowid)

    return jsonify({"saved_ids": saved_ids})

# Get saved flashcards
@app.route("/api/flashcards", methods=["GET"])
def get_flashcards():
    cursor.execute("SELECT id, question, answer, created_at FROM flashcards ORDER BY created_at DESC")
    rows = cursor.fetchall()
    flashcards = [
        {"id": row[0], "question": row[1], "answer": row[2], "created_at": row[3].strftime("%Y-%m-%d %H:%M:%S")}
        for row in rows
    ]
    return jsonify({"flashcards": flashcards})

if __name__ == "__main__":
    app.run(debug=True)