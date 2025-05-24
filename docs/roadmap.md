# Speedrun Coding v2 Roadmap

## High-Level Plan

1. ✅ **Infrastructure & Project Setup**  
2. ✅ **Data Modeling & Database Setup**  
3. ✅ **Backend API Development**  
4. ✅ **Code Execution Engine Integration**  
5. ⏳ **Frontend Application Development**  
6. ⏳ **Authentication & User Profiles**  
7. ⏳ **Core Feature Implementation**  
8. ⏳ **Testing & Quality Assurance**  
9. ⏳ **Containerization, Deployment & Documentation**  

---

## Detailed Breakdown

Note that we wil rely on Docker and Docker Compose for local development and testing.
We should test and insanity check at each step.


### 1. Infrastructure & Project Setup
- ✅ **1.1. Repository & Project Management**  
  - ✅ 1.1.1. Create GitHub repo (public or private)  
  - ✅ 1.1.2. Add README, LICENSE, issue/PR templates  
  - ✅ 1.1.3. Set up project board (GitHub Projects, Trello, etc.)  
- ✅ **1.2. Directory Structure & Tooling**  
  - ✅ 1.2.1. Define monorepo folders: `/backend`, `/frontend`, `/sandbox`  
  - ✅ 1.2.2. Add language-specific `.gitignore`  
  - ✅ 1.2.3. Install Docker & Docker Compose locally  
  - ✅ 1.2.4. Scaffold `docker-compose.yml` with placeholders for each service  

### 2. Data Modeling & Database Setup
- ✅ **2.1. Schema Design**  
  - ✅ 2.1.1. Review SQL schema for  `problems`, `submissions`  
  - ✅ 2.1.2. Confirm fields, types, indexes and relationships  
- ✅ **2.2. Initialize the Database service**  
  - ✅ 2.2.1. Create the sql database initialization script
  - ✅ 2.2.2. Update the docker compose to have database service running.

### 3. Backend API Development
- ✅ **3.1. Django Project Setup**  
  - ✅ 3.1.1. Create Django project structure (use port 8005 instead of 8000)
  - ✅ 3.1.2. Configure settings (database connection, REST framework)  
  - ✅ 3.1.3. Set up URL routing  
- ✅ **3.2. Django Models**
  - ✅ 3.2.1. User model: we can use Django built-in, do not use custom user model.
  - ✅ 3.2.2. Problem model with JSON fields for thresholds, templates, etc.  
  - ✅ 3.2.3. Submission model with relationships to User and Problem  
- ✅ **3.3. Model Serializers**  
  - ✅ 3.3.1. Create DRF serializers for each model  
  - ✅ 3.3.2. Include nested serialization for complex fields  
- ✅ **3.4. API Endpoints**  
  - ✅ 3.4.1. Authentication endpoints (register, login, refresh token)  
  - ✅ 3.4.2. Problem endpoints (list, retrieve)  
  - ✅ 3.4.3. Submission endpoints (create, list, retrieve)  
  - ✅ 3.4.4. User profile endpoints (stats, history)  
- ✅ **3.5. Authentication**  
  - ✅ 3.5.1. Implement JWT authentication with SimpleJWT  
  - ✅ 3.5.2. Set up permission classes for protected endpoints  
- ✅ **3.6. Code Execution Integration**  
  - ✅ 3.6.1. Create service for interacting with the sandbox  
  - ✅ 3.6.2. Implement submission processing logic  
- ✅ **3.7. Admin Interface**  
  - ✅ 3.7.1. Configure Django admin for Problem management  
  - ✅ 3.7.2. Customize admin forms for complex JSON fields 

### 4. Code Execution Engine Integration
- ✅ **4.1. Engine Evaluation**  
  - ✅ 4.1.1. Compare Piston vs Judge0 (features, resource limits)  
  - ✅ 4.1.2. Lock in choice and version  
- ✅ **4.2. Containerization**  
  - ✅ 4.2.1. Add sandbox service to `docker-compose.yml`  
  - ✅ 4.2.2. Expose necessary ports, set network aliases  
- ✅ **4.3. Backend Client**  
  - ✅ 4.3.1. Write a service module to POST code → engine API  
  - ✅ 4.3.2. Map languages, timeouts, handle JSON response  
  - ✅ 4.3.3. Persist `raw_results`, execution time & memory in `Submission`  

### 5. Frontend Application Development
- ✅ **5.1. Project Bootstrap**  
  - ✅ 5.1.1. Create Next.js 14 app with TypeScript  
  - ✅ 5.1.2. Install & configure Tailwind CSS  
  - ✅ 5.1.3. Create Hello world landing place page 
  - ✅ 5.1.4. Add SWR (or React Query) and Monaco Editor packages  
- ✅ **5.2. Global Setup**  
  - ✅ 5.2.1. Environment variables for API base URL & JWT  
  - ✅ 5.2.2. Layout component with theme switcher (light/dark)  
  - ✅ 5.2.3. Create User registration and login page. 
- ⏳ **5.3. Pages & Components**  
  - ✅ 5.3.1. **Problem List**: fetch, filter, paginate  
  - ✅ 5.3.2. **Problem Detail & Code submission**: render Markdown. Editor: Monaco instance with language selector.
  - ✅ 5.3.3. **Submission Results**: table of tests + metrics + rank  
  - ✅ 5.3.4  **Problem Create/Modify Page**.
  - 📅 5.3.5. **Profile**: stats charts  
- ⏳ **5.4. Advanced Problem Management UI**
  - ✅ 5.4.1. **Problem Editor**: Multi-step form with sections for different problem components
  - ✅ 5.4.2. **Code Editors**: Monaco Editor integration with syntax highlighting and code completion
  - ✅ 5.4.3. **Markdown Editor**: Rich editor for problem descriptions with live preview
  - ✅ 5.4.4. **File Management**: UI for managing harness_eval_files
  - 📅 5.4.5. **Test Integration**: Interface for testing reference solutions with real-time feedback

### 6. Authentication & User Profiles
- ✅ **6.1. Backend Endpoints**  
  - ✅ 6.1.1. Register (username/email/password)  
  - ✅ 6.1.2. Login → issue JWT + refresh  
  - ✅ 6.1.3. Refresh/revoke tokens  
- ✅ **6.2. Frontend Flows**  
  - ✅ 6.2.1. Registration & login forms, API hooks  
  - ✅ 6.2.2. Token storage (cookie or localStorage)  
  - ✅ 6.2.3. Protected-route wrapper + logout  
- ⏳ **6.3. Profile & Stats API**  
  - ⏳ 6.3.1. Endpoint for solve count, average times, history  
  - ⏳ 6.3.2. Display on Profile page with simple charts  

### 7. Core Feature Implementation
- ✅ **7.1. Problem Management**  
  - ✅ 7.1.1. Ensure Admin CRUD is fully functional  
  - ✅ 7.1.2. Expose tags, difficulty, thresholds in API  
- ✅ **7.2. Submission Workflow**  
  - ✅ 7.2.1. Start timer when user begins coding or page loads  
  - ✅ 7.2.2. On "Submit," record `started_at`, send code + language  
  - ✅ 7.2.3. Backend forwards to sandbox, awaits result  
  - ✅ 7.2.4. Record `submitted_at`, compute `duration_ms` & pass/fail  
- ✅ **7.3. Judging UI & Feedback**  
  - ✅ 7.3.1. Show per-test pass/fail + error messages  
  - ✅ 7.3.2. Display execution time, memory, and rank badge  
- 📅 **7.4. Edge-Case Handling**  
  - 📅 7.4.1. Sandbox timeouts & infinite loops  
  - 📅 7.4.2. Compilation/runtime errors  
  - 📅 7.4.3. Code size & resource limits  

### 8. Testing & Quality Assurance
- ⏳ **8.1. Backend Tests**  
  - 📅 8.1.1. Unit tests for models/serializers  
  - 📅 8.1.2. API tests (viewsets, auth flows) with mocked sandbox  
- 📅 **8.2. Frontend Tests**  
  - 📅 8.2.1. Component/unit tests (React Testing Library)  
  - 📅 8.2.2. End-to-end tests (Cypress) for key flows  
- 📅 **8.3. Manual QA & Cross-Browser**  
  - 📅 8.3.1. Test on Chrome/Firefox/Edge  
  - 📅 8.3.2. Responsive checks for mobile/tablet  

### 9. Containerization, Deployment & Documentation
- ⏳ **9.1. Dockerfiles & Compose**  
  - 📅 9.1.1. Write production-ready Dockerfiles for frontend & backend  
  - 📅 9.1.2. Finalize `docker-compose.yml` for local dev  
- 📅 **9.2. Documentation**  
  - 📅 9.2.1. Expand README with setup, contribution guide  
  - 📅 9.2.2. Document API (OpenAPI/Swagger) and environment vars  
- 📅 **9.3. Post-MVP Planning**  
  - 📅 9.3.1. Draft Phase 2 backlog (more languages, analytics)  
  - 📅 9.3.2. Evaluate CI/CD pipeline options  

