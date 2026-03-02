# Self-Implementation Guide: Contextual Multi-Armed Bandit (LinUCB)

This guide provides the roadmap, formulas, and architectural patterns you need to implement the CMAB recommendation engine in ALPS.

---

## Phase 1: Data Model Updates
First, we need to add "Topic" metadata to our content so the bandit knows what it is recommending.

### 1. Tag Lessons and Quizzes
In `backend/app/models/course.py` (for Lessons) and `backend/app/models/quiz.py` (for Quizzes):
- Add a `topics` column (Type: `db.String` or `db.Text`).
- Tip: Store it as a JSON string like `["Recursion", "Big O"]`.
- Run migrations: `flask db migrate -m "add topics to content"` then `flask db upgrade`.

### 2. Parameter Persistence
Since LinUCB is "stateful," it needs to remember its weights for every resource.
- Create a new model `BanditParam` in `backend/app/models/bandit.py`.
- Columns needed:
  - `resource_id`: FK to the Resource.
  - `matrix_a`: A flattened JSON array (representing the $d \times d$ matrix).
  - `vector_b`: A JSON array (representing the $d$-dimensional vector).
- Note: Initialize $A$ as an Identity Matrix ($I$) and $b$ as a zero vector.

---

## Phase 2: Building the Dynamic Context Vector ($x_t$)
The "Context" is the mathematical snapshot of the student. Because ALPS supports multiple courses with different concepts, the size of this vector changes depending on the course the student brings context from.

### Creating the Course-Specific Vector:
Instead of a hardcoded list of concepts, you must build the vector dynamically based on the current course:

1.  **Determine Dimensionality ($d$)**: Query the database for all unique `topics` linked to the current `course_id`.
    - If a course has 5 concepts, $d$ will be 9 (5 concepts + 4 behavior stats).
    - If a course has 20 concepts, $d$ will be 24 (20 concepts + 4 behavior stats).
2.  **[0 to $n-1$] Mastery**: Iterate through the course's concepts and pull current mastery for each one.
3.  **[$n$] Accuracy**: (Correct Answers / Total Questions) for the last quiz.
4.  **[$n+1$] Delay**: Normalized response time (1 - (actual_time / time_limit)).
5.  **[$n+2$] Improvement**: The Delta between current score and previous score.
6.  **[$n+3$] Engagement**: A 1.0 if they completed the last recommended resource, 0.0 otherwise.

*Note: In `BanditParam`, matrices $A$ and vectors $b$ must be initialized to match the dimensionality ($d$) of the course they belong to ($A$ as a $d \times d$ identity matrix, $b$ as a length-$d$ zero vector).*

---

## Phase 3: The LinUCB Algorithm
Create a new file `backend/app/services/bandit_service.py`.

### The Core Logic
For every possible recommendation (arm) $a$ available in the *current course*:
1.  **Fetch Parameters**: Load $A_a$ and $b_a$ from the database.
2.  **Verify Dimensionality**: Ensure $A_a$ and $b_a$ match the length of the student's dynamic context vector $x_t$.
3.  **Compute Theta**: $\hat{\theta}_a = A_a^{-1} b_a$ (Use `numpy.linalg.inv`).
4.  **Compute Score**:
    $$p_{t,a} = \hat{\theta}_a^T x_t + \alpha \sqrt{x_t^T A_a^{-1} x_t}$$
    - Left side = **Exploitation** (What we think is good).
    - Right side = **Exploration** (Bonus for resources we haven't tried with this "type" of student).
5.  **Selection**: Choose $a_t = \text{argmax}(p_t)$.

---

## Phase 4: Integration (The Loop)
Update the `submit_quiz` route in `backend/app/routes/quizzes.py`.

1.  **Observe Reward**: Look at the quiz score improvement from the *previous* recommendation.
2.  **Update Step**: Update the $A$ and $b$ matrices for the *previous* action:
    - $A_{old} = A_{old} + x_{old} x_{old}^T$
    - $b_{old} = b_{old} + r_t x_{old}$
    - (Where $r_t$ is the reward and $x_{old}$ is the dynamic context from when the recommendation was made).
3.  **Select New Action**:
    - Build current context $x_t$.
    - Run the selection logic from Phase 3.
    - Create a new `Recommendation` record.

---

## Phase 5: The Reward Function
The "Reward" $(r)$ tells the bandit if its choice was good.
- **Formula**: $r = 0.5(\text{Score}) + 0.3(\text{Improvement}) - 0.2(\text{Difficulty Mismatch})$
- If $r$ is high, the bandit will be more likely to recommend similar resources to similar students in the future.

---

## Tools You'll Need
- **NumPy**: For matrix inversion and dot products.
- **Flask-Migrate**: For the database changes.
- **Postman**: To trigger quiz submissions and watch the recommendations change.

Good luck! This is a high-level task, but implementing it manually will give you a deep understanding of how production-grade recommendation systems actually work.
