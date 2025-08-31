# AI Study Buddy – Flashcard Generator

*Hackathon Focus:* SDG 4 – Quality Education  

## Project Prompt
> Create an AI-powered study tool that allows students to paste notes and instantly generate interactive flashcards for rapid learning.  
> The tool should demonstrate creativity, UI/UX design, technical flow, rapid prototyping, and fault tolerance.

## Tech Stack

- *Frontend:* HTML5, CSS3 (animations), JavaScript (interactive flashcards)  
- *Backend:* Python (Flask) + MySQL (store flashcards)  
- *AI:* Hugging Face Question-Answering API  

## How It Works

1. User pastes study notes into the text area.  
2. Python backend sends the notes to Hugging Face API requesting 5 Q&A flashcards.  
3. JavaScript dynamically generates interactive flip cards.  
4. Flashcards can be saved to MySQL for later review.  
5. Library view allows users to see previously saved flashcards.  

## Features

- Simple, beginner-friendly UI  
- Interactive flip cards with question/answer  
- Save & retrieve flashcards from database  
- Supports rapid prototyping for testing and feedback  
- Clean separation of frontend, backend, and AI logic  

## Setup Instructions

1. Clone the repo:
```bash
git clone https://github.com/yusuf-328/vibe_coding_Hackathon.git
cd vibe_coding_Hackathon
