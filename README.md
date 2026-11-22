# Mental Matters

An AI-assisted mental wellbeing chatbot built as a minor project at the Department of Electronics and Computer Engineering, IOE Thapathali Campus. Mental Matters gives registered users a conversational interface for discussing concerns such as stress, sleep, anxiety, and loneliness, while recording conversations, ratings, and feedback for future improvement.

> [!IMPORTANT]
> Mental Matters is an educational prototype, not a medical device or a replacement for a qualified mental-health professional. Its generated responses may be incomplete or incorrect. If you or someone else may be in immediate danger, contact local emergency services or an appropriate crisis helpline.

![Mental Matters chatbot interface](screenshots/chatbot_interface.png)

## What it does

- Registers users and authenticates returning users.
- Generates conversational responses with a fine-tuned GPT-2 model hosted on Hugging Face.
- Provides suggested questions to help users begin a conversation.
- Stores each user prompt and generated response in PostgreSQL.
- Collects a one-to-five-star rating and written feedback.
- Updates a user's existing feedback when they submit it again.

## Architecture

```mermaid
flowchart LR
    U[User] --> SPA[React + TypeScript SPA]
    SPA -->|JSON over HTTP| API[Flask REST API]
    API -->|Load tokenizer and model; run inference| HF[Fine-tuned GPT-2 on Hugging Face]
    API -->|Users, interactions, ratings, feedback| DB[(PostgreSQL)]
```

The React single-page application contains registration, login, and chatbot views. It calls a Flask API, which coordinates model inference and persistence. The model currently used by the backend is [`Pranilllllll/finetuned_gpt2_45krows_10epochs`](https://huggingface.co/Pranilllllll/finetuned_gpt2_45krows_10epochs).

### Chat request flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React client
    participant API as Flask API
    participant Model as GPT-2 model
    participant DB as PostgreSQL

    User->>UI: Send a message
    UI->>API: POST /post_userinput
    API->>Model: Generate response
    Model-->>API: Generated text
    API->>DB: Save prompt, response, and user ID
    DB-->>API: Commit
    API-->>UI: JSON response
    UI-->>User: Display response
```

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, TypeScript, React Router, Axios, Tailwind CSS |
| Backend | Python, Flask, Flask-CORS |
| Machine learning | Hugging Face Transformers, PyTorch, fine-tuned GPT-2 |
| Database | PostgreSQL, psycopg2 |

## Repository structure

```text
.
├── backend/
│   ├── ml_models/
│   │   └── chabot_response.py   # Model loading and text generation
│   ├── requirements.txt
│   └── server.py                # Flask routes and database operations
├── public/                      # Static web assets
├── screenshots/                 # README screenshots
├── src/
│   ├── Components/              # Registration, login, and chat views
│   ├── App.tsx                  # Client-side routes
│   └── index.tsx                # React entry point
├── package.json
└── tailwind.config.js
```

## Getting started

### Prerequisites

- Node.js and npm
- Python 3.9 or newer
- PostgreSQL
- Internet access on the backend's first inference request so Transformers can download the hosted model
- Sufficient memory for local GPT-2 inference; a GPU is optional

### 1. Clone the repository

```bash
git clone https://github.com/praniil/THA-minor-project.git
cd THA-minor-project
```

### 2. Create the PostgreSQL database

Create an empty database and retain its connection URL. For example:

```sql
CREATE DATABASE mental_wellbeing_db;
```

The API creates its four tables lazily as the corresponding endpoints are used. The database user therefore needs permission to create tables and insert, select, and update rows.

### 3. Configure and start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install torch
```

Create `backend/.env`:

```dotenv
db_url=postgresql://USERNAME:PASSWORD@localhost:5432/mental_wellbeing_db
PORT=8080
```

Then start Flask from the `backend` directory:

```bash
python server.py
```

Confirm it is running:

```bash
curl http://127.0.0.1:8080/
```

The response should be `{"message":"Server is running!"}`.

> [!NOTE]
> `torch` is required for inference but is currently commented out in `backend/requirements.txt`, allowing developers to select the appropriate CPU or CUDA build themselves.

### 4. Install and start the frontend

From another terminal, at the repository root:

```bash
npm install
npm start
```

The app opens at `http://localhost:3000`.

The current frontend components call the deployed API at `https://tha-minor-project-1.onrender.com` directly. To use your local API, replace that origin in:

- `src/Components/Register.tsx`
- `src/Components/Login.tsx`
- `src/Components/Chatbot.tsx`

with `http://127.0.0.1:8080`, or refactor it into a shared environment-based API URL. The `proxy` value in `package.json` currently points to port `5000`, while the backend defaults to port `8080`; the two must match if you switch to relative request URLs.

## Using the application

1. Create an account on the registration page.
2. Log in with the registered email address and password.
3. Enter a message or choose one of the suggested questions.
4. Use **Submit Feedback** to add or replace your written feedback.
5. Use **Rate Us** to submit a rating from one to five stars.

![Registration page](screenshots/register_page.png)

<details>
<summary>More conversation screenshots</summary>

![Chatbot interaction, part one](screenshots/chatbot_iteraction_1.png)

![Chatbot interaction, part two](screenshots/chatbot_iteraction_2.png)

</details>

## API reference

All request bodies use JSON.

| Method | Endpoint | Purpose | Request fields |
| --- | --- | --- | --- |
| `GET`, `HEAD` | `/` | Health check | None |
| `POST` | `/` | Register an account | `firstname`, `lastname`, `email`, `password`, `confirmPassword` |
| `POST` | `/post_login_data` | Authenticate an account | `email`, `password` |
| `POST` | `/post_userinput` | Generate and store a reply | `input`, `user_id` |
| `POST` | `/submit_rating` | Store a rating | `rating`, `user_id` |
| `POST` | `/submit_feedback` | Create or update feedback | `feedback`, `user_id` |

Example chat request:

```bash
curl -X POST http://127.0.0.1:8080/post_userinput \
  -H "Content-Type: application/json" \
  -d '{"input":"How can I manage stress?","user_id":1}'
```

Example response:

```json
{
  "user_input": "How can I manage stress?",
  "chatbot_response": "...generated response..."
}
```

## Database model

```mermaid
erDiagram
    UserAccount ||--o{ InteractionLog : has
    UserAccount ||--o{ Ratings : submits
    UserAccount ||--o{ Feedback : provides

    UserAccount {
        serial user_id PK
        varchar firstname
        varchar lastname
        varchar email UK
        varchar password
        timestamp created_at
        timestamp last_login
    }
    InteractionLog {
        serial interaction_id PK
        varchar user_input
        varchar llm_response
        integer user_id FK
    }
    Ratings {
        serial rating_id PK
        integer rating
        integer user_id FK
        timestamp created_at
    }
    Feedback {
        serial feedback_id PK
        text feedback_message
        integer user_id FK
        timestamp created_at
    }
```

`UserAccount.email` is unique. Interaction text columns are limited to 1,000 characters. The API permits multiple ratings per user, while its feedback logic keeps one effective feedback record per user by updating the first existing record.

## Model background

The hosted GPT-2 checkpoint was fine-tuned for 10 epochs with a batch size of 4 and a learning rate of `3e-5`. The project used mental-health and psychology conversation data from these Hugging Face datasets:

- `marmikpandya/mental-health`
- `fadodr/mental_health_therapy`
- `Amod/mental_health_counseling_conversations`
- `jkhedri/psychology-dataset`
- `samhog/psychology-6k`
- `RAJJ18/mental_health_dataset` (3,000-row subset)

The original training and evaluation script is not included in this repository, so the checkpoint cannot be reproduced from this code alone. The backend only contains the inference integration.

## Current limitations

This repository is a learning prototype and should not be deployed with sensitive or real patient data in its current form.

- Passwords are stored and compared as plain text; use a slow password hash such as Argon2 or bcrypt before deployment.
- Authentication does not issue sessions or tokens, and protected endpoints trust the supplied `user_id`.
- The client hardcodes the deployed backend URL and has no environment-based API configuration.
- Database tables are created inside request handlers rather than through versioned migrations.
- Input validation, centralized error handling, rate limiting, and crisis/escalation safeguards are not implemented.
- The model and tokenizer are downloaded and initialized for every chat request, increasing response latency and memory use.
- Model output is stochastic and is not checked by a clinical safety layer.
- The included default frontend test is still the Create React App placeholder and does not match the current interface.
- The Flask development server runs with debug mode enabled in `server.py` and is not suitable for production.

## Suggested next steps

- Add password hashing, token- or session-based authentication, and endpoint authorization.
- Load the model once at application startup and add explicit inference error handling.
- Move the API origin into a frontend environment variable.
- Add schema migrations, request validation, database constraints for rating ranges, and connection cleanup on errors.
- Add unit and integration tests for registration, login, inference, feedback, and ratings.
- Add crisis-language detection, clear escalation guidance, and evaluation with qualified mental-health professionals.
- Package the frontend, API, database, and model configuration for reproducible deployment.

## Team

- [Amrita Shahi](https://github.com/amritashahi)
- [Pranil Parajuli](https://github.com/praniil)
- [Raj Simkhada](https://github.com/RAJ-Git18)
- [Sugam Dahal](https://github.com/sugam24)

Department of Electronics and Computer Engineering<br>
Tribhuvan University, Institute of Engineering, Thapathali Campus, Kathmandu

## Contributing

Contributions and suggestions are welcome. Fork the repository, create a focused feature branch, commit your changes, and open a pull request describing what changed and how it was tested. Please avoid committing credentials, `.env` files, model caches, or personal conversation data.

## License

This project is licensed under the [MIT License](LICENSE).
