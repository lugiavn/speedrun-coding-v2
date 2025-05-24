# SpeedrunCoding v2 https://speedruncoding.com

A LeetCode-style web application focused on coding speed, helping users improve not just correctness but also how quickly they can solve problems under timed conditions.

## Project Overview

Speedrun Coding v2 is designed to help developers practice coding challenges with an emphasis on speed. The application includes:

- Problem browsing and filtering by tags/difficulty
- In-browser code editor with syntax highlighting
- Code execution and testing
- Performance metrics and rankings based on solving time
- User accounts and progress tracking

## Development Progress

Refer to `docs/roadmap.md`

## Architecture

The project follows a modern web application architecture:

- **Backend**: Django REST Framework API (Python)
- **Frontend**: Next.js (React) with TypeScript and Tailwind CSS
- **Database**: PostgreSQL
- **Code Execution**: Piston (Self-hosted sandbox environment)
- **Authentication**: JWT-based authentication

For more detail refer to `docs/system.md`

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Git

### Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   cd speedrun-coding-v2
   ```

2. Start the services with docker-compose:
   ```
   bash start_service_stack.dev.sh
   ```

3. Access the application:
   - Frontend: http://localhost:3000/
   - Backend API: http://localhost:8005/api/
   - Django Admin: http://localhost:8005/admin/
     - Username: admin
     - Password: admin

### Project Structure

```
speedruncodingv2/
├── backend/                     # Django backend
│   ├── api/                     # API app with models, views, etc.
│   │   ├── admin.py            # Admin interface configuration
│   │   ├── code_runner_service.py # Service for code execution
│   │   ├── models.py           # Database models
│   │   ├── serializers.py      # API serializers
│   │   ├── urls.py             # API routing
│   │   └── views.py            # API endpoints and logic
│   ├── speedruncoding/         # Django project settings
│   ├── Dockerfile              # Backend container configuration
│   ├── entrypoint.sh           # Container startup script
│   └── requirements.txt        # Python dependencies
├── frontend/                   # Next.js frontend
│   ├── src/                    # Source code
│   │   ├── app/                # Next.js app directory
│   │   │   ├── admin/          # Admin section pages
│   │   │   ├── login/          # User authentication pages
│   │   │   ├── logout/         # Logout functionality
│   │   │   ├── problems/       # Problem listing and detail pages
│   │   │   │   └── [slug]/     # Dynamic problem detail and code submittion page
│   │   │   ├── register/       # User registration page
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── layout.tsx      # App layout
│   │   │   └── providers.tsx   # React providers configuration
│   │   ├── components/         # Reusable components
│   │   │   ├── admin/          # Admin components
│   │   │   │   ├── ProblemForm.tsx         # Problem creation/editing form
│   │   │   │   ├── CodeEntriesEditor.tsx   # Editor for code templates/solutions
│   │   │   │   └── HarnessFilesEditor.tsx  # Editor for harness files
│   │   │   ├── ui/             # UI components
│   │   │   ├── AuthProvider.tsx # Authentication context provider
│   │   │   ├── Layout.tsx      # Main layout with header/footer
│   │   │   ├── ProblemSubmissionsList.tsx # Submission listing component
│   │   │   ├── ThemeProvider.tsx # Dark/light theme context provider
│   │   │   └── ThemeToggle.tsx # Theme toggle button component
│   │   └── lib/               # Utilities and hooks
│   │       ├── api.ts         # API client
│   │       ├── config.ts      # Environment configuration
│   │       ├── utils.ts       # Utility functions
│   │       └── hooks/         # Custom React hooks
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── Dockerfile             # Frontend container configuration
├── piston/                    # Code execution service configuration
│   ├── Dockerfile             # Piston container configuration
│   └── notes.md               # Notes on Piston setup
├── init-scripts/              # Database initialization scripts
│   └── 01-init.sql            # Initial database schema
├── data/                      # Persistent data storage
├── docs/                      # Project documentation
│   ├── database.md            # Database schema documentation
│   ├── roadmap.md             # Development roadmap
│   └── system.md              # System architecture overview
├── swagger.json               # API documentation
└── docker-compose.yml         # Docker services configuration
```

## Database Schema

```
(base) lugia@namsyoga:/mnt/c/linux_home/speedruncodingv2/speedruncodingv2$ sudo docker-compose exec backend python manage.py inspectdb | cat
```

Refer to models.py

```


class Problem(models.Model):
    title = models.TextField(null=False)
    slug = models.TextField(null=False, unique=True)
    description_md = models.TextField(null=False)
    tags = ArrayField(models.TextField(), default=list)
    difficulty = models.TextField(null=True, blank=True)
    time_thresholds = models.JSONField(null=False)
    solution_templates = models.JSONField(null=False)
    reference_solutions = models.JSONField(null=False)
    harness_eval_files = models.JSONField(null=True, blank=True)
    enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'problems'

    def __str__(self):
        return self.title


class Submission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    language = models.TextField(null=False)
    code = models.TextField(null=False)
    started_at = models.DateTimeField(null=False)
    submitted_at = models.DateTimeField(null=False)
    status = models.TextField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)
    memory_kb = models.IntegerField(null=True, blank=True)
    passed = models.BooleanField(null=False)
    rank = models.TextField(null=True, blank=True)
    raw_results = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'submissions'

    def __str__(self):
        return f"{self.user.username if self.user else 'Anonymous'} - {self.problem.title} - {self.language}" 

```

The database also includes standard Django authentication tables for user management.

## API Endpoints

The API endpoints are documented using Swagger/OpenAPI:

- Swagger UI: http://localhost:8005/swagger/
- ReDoc UI: http://localhost:8005/redoc/
- OpenAPI Schema: http://localhost:8005/swagger.json

(also refer to the swagger.json file)

Main endpoints include:

- Authentication:
  - `/api/token/`: Obtain JWT token
  - `/api/token/refresh/`: Refresh JWT token
  - `/api/register/`: Register a new user

- Users:
  - `/api/users/`: List users
  - `/api/users/me/`: Get current user information

- Problems:
  - `/api/problems/`: List and create problems
  - `/api/problems/{id}/`: Retrieve, update, or delete a problem

- Submissions:
  - `/api/submissions/`: List and create submissions
  - `/api/submissions/{id}/`: Retrieve a submission
  - `/api/submissions/stats/`: Get user submission statistics

All API endpoints require JWT authentication except for registration and token endpoints. Admin users have additional permissions for creating and modifying problems.

## Development Workflow

1. **Backend Development**:
   - Models are in `backend/api/models.py`
   - API views will be added to `backend/api/views.py`
   - URL routing is in `backend/api/urls.py`

2. **Database Changes**:
   - Create migrations: `docker-compose exec backend python manage.py makemigrations`
   - Apply migrations: `docker-compose exec backend python manage.py migrate`

3. **Testing**:
   - Run tests: `docker-compose exec backend python manage.py test`

4. **Admin Interface**:
   - Manage problems and submissions via the Django admin interface

## Troubleshooting

- **Reset Database**: `docker-compose down -v && docker-compose up -d`
- **View Logs**: `docker-compose logs backend` or `docker-compose logs db`
- **Access Shell**: `docker-compose exec backend bash`
- **Database Shell**: `docker-compose exec db psql -U postgres -d speedruncoding`


## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This means:
- You can freely use, modify, and distribute this software
- Any modifications or derivative works must also be released under the GPL v3
- You must include the original source code when distributing
- Changes made to the code must be documented

For more information about the GPL v3 license, visit https://www.gnu.org/licenses/gpl-3.0.en.html




