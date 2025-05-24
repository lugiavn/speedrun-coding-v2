from typing import List, Dict, Any, Optional, TypedDict
import random
import json
import time 
import requests
import os

TIMEOUT_SECONDS = 2

class ExecutionFile(TypedDict):
    """
    Represents a file to be made available during code execution.
    Matches the structure expected for harness_eval_files if they are passed as simple name/content pairs.
    """
    filename: str
    content: str
    # encoding: Optional[str] # Could be added if engines require specific encodings per file

class ExecutionResult(TypedDict):
    """
    Standardized result from the code execution service.
    """
    status: str  # e.g., "success", "compile_error", "runtime_error", "timeout", "internal_error"
    stdout: Optional[str]
    stderr: Optional[str]
    # 'output' can be a combined stdout/stderr or the primary result string from the execution engine.
    output: Optional[str]
    duration_ms: Optional[int] # Execution time in milliseconds
    memory_kb: Optional[int]   # Peak memory usage in kilobytes
    exit_code: Optional[int] # Process exit code, if applicable
    error_message: Optional[str] # Human-readable summary of error, if any
    # This field can store the full, raw response from the specific code execution engine
    # or any other detailed engine-specific data for debugging or extended analysis.
    engine_specific_response: Dict[str, Any]

def execute_code(
    language: str,
    version: Optional[str],
    code_to_execute: str,
    harness_eval_files: Optional[List[ExecutionFile]]
) -> ExecutionResult:
    print(f"--- REAL PROD CODE RUNNER --- {language} {version} ---", flush=True)
    if language not in ["python", "cpp"]:
        return execute_code_mock(language, version, code_to_execute, harness_eval_files)

    eval_driver_file = None 
    if harness_eval_files is not None:
        for f in harness_eval_files:
            if f['filename'] == 'eval_submission_codes.py' and language == "python":
                eval_driver_file = f
            if f['filename'] == 'eval_submission_codes.cpp' and language == "cpp":
                eval_driver_file = f
    if eval_driver_file is None:
        return execute_code_mock(language, version, code_to_execute, harness_eval_files)

    version = version or "*"

    from django.conf import settings

    payload = {
        "language": language,
        "version": version,
        "run_timeout": TIMEOUT_SECONDS * 1000,
        "compile_timeout ": 10 * 1000,
        "files": [{
            "name": eval_driver_file['filename'],
            "content": eval_driver_file['content']
        }, {
            "name": "submission_codes.py" if language == "python" else "submission_codes",
            "content": code_to_execute
        }]
    }

    try:
        # Get Piston service URL from settings or use default
        piston_url = getattr(settings, 'PISTON_API_URL', 'http://piston:2000/api/v2/execute')
        
        print(f"Calling Piston API at {piston_url}", flush=True)
        print(f"Payload: {json.dumps(payload, indent=2)[:1000]}", flush=True)
        
        # Make the API call to Piston
        response = requests.post(
            piston_url,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=1+TIMEOUT_SECONDS
        )
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Parse the response
        piston_result = response.json()
        print(f"Piston API Response: {json.dumps(piston_result, indent=2)}", flush=True)
        
        # Map Piston response to our ExecutionResult format
        status = "success"
        if piston_result.get("compile", {}).get("code", 0) != 0:
            status = "compile_error"
        elif "Time limit exceeded" in (piston_result.get("run", {}).get("message", None) or ""):
            status = "timeout_error"
        elif piston_result.get("run", {}).get("code") != 0:
            status = "runtime_error"
        elif 'Incorrect' in piston_result.get("run", {}).get("stdout", ""):
            status = "Tests failed"
        elif 'Correct' not in piston_result.get("run", {}).get("stdout", ""):
            status = "Unknown"
        result: ExecutionResult = {
            "status": status,
            "stdout": piston_result.get("run", {}).get("stdout", ""),
            "stderr": piston_result.get("run", {}).get("stderr", ""),
            "output": piston_result.get("run", {}).get("output", ""),
            "duration_ms": piston_result.get("run", {}).get("time", 0) * 1000,  # Convert to milliseconds
            "memory_kb": piston_result.get("run", {}).get("memory", 0),
            "exit_code": piston_result.get("run", {}).get("code", 0),
            "error_message": piston_result.get("message", ""),
            "engine_specific_response": piston_result
        }
        return result
    
    except Exception as e:
        error_str = f"{type(e)} {str(e)}"
        return {
            "status": "internal_error",
            "stdout": "",
            "stderr": f"Unexpected error: {error_str}",
            "output": f"Unexpected error: {error_str}",
            "duration_ms": None,
            "memory_kb": None,
            "exit_code": None,
            "error_message": f"Unexpected error during code execution: {error_str}",
            "engine_specific_response": {"error": error_str}
        }

def execute_code_mock(
    language: str,
    version: Optional[str],
    code_to_execute: str,
    harness_eval_files: Optional[List[ExecutionFile]]
) -> ExecutionResult:
    """
    MOCK IMPLEMENTATION: Simulates executing code and returns a dummy result.

    This function is intended to be replaced by a real implementation that
    interacts with a code execution engine (e.g., Piston, Judge0, or custom sandbox).

    Args:
        language: The programming language (e.g., "python", "cpp").
        version: The specific version of the language (e.g., "3.10", "17").
        code_to_execute: The source code to be executed.
        harness_eval_files: A list of auxiliary files (e.g., test inputs, helper scripts)
                            to be available during execution. Each file is a dictionary
                            with 'filename' and 'content'.

    Returns:
        An ExecutionResult dictionary containing the outcome of the simulated execution.
    """
    # Log entry: function called with arguments
    print("--- execute_code (mock) called ---", flush=True)
    print(f"Language: {language}, Version: {version}", flush=True)
    print(f"Code to execute (first 100 chars): {code_to_execute[:100]}{'...' if len(code_to_execute) > 100 else ''}", flush=True)
    if harness_eval_files:
        print(f"Harness files ({len(harness_eval_files)}):", flush=True)
        for i, h_file in enumerate(harness_eval_files):
            print(f"  - [{i+1}] {h_file['filename']} ({len(h_file['content'])} bytes)", flush=True)
    else:
        print("Harness files: None", flush=True)
    print("------------------------------------", flush=True)

    # Add a 3-second sleep to simulate longer processing time
    print("Sleeping for 3 seconds to simulate processing...", flush=True)
    time.sleep(3)
    print("Sleep complete, continuing execution", flush=True)

    # Simulate some processing time and memory usage
    simulated_duration_ms = random.randint(50, 500)
    simulated_memory_kb = random.randint(1024, 8192)

    # Simple mock logic: if "error" is in the code, simulate a runtime error for Python
    if "pass-me" not in code_to_execute.lower():
        mock_stderr = f"Traceback (most recent call last):\n  File \"user_code.py\", line N, in <module>\n    raise ValueError(\"Simulated mock error in {language} code\")"
        result: ExecutionResult = {
            "status": "runtime_error",
            "stdout": "An error occurred during execution.",
            "stderr": mock_stderr,
            "output": f"An error occurred during execution.\n{mock_stderr}",
            "duration_ms": simulated_duration_ms,
            "memory_kb": simulated_memory_kb,
            "exit_code": 1,
            "error_message": "A simulated runtime error was triggered.",
            "engine_specific_response": {
                "engine": "mock_engine_v1",
                "simulated_error_type": "ValueError",
                "language_requested": language,
                "version_requested": version or "latest",
                "harness_files_count": len(harness_eval_files) if harness_eval_files else 0,
            }
        }
    else:
        # Simulate successful execution
        mock_stdout_lines = [f"Mock execution successful for {language} (version: {version or 'default'})."]
        mock_stdout_lines.append(f"Code snippet: {code_to_execute[:70]}{'...' if len(code_to_execute) > 70 else ''}")

        if harness_eval_files:
            mock_stdout_lines.append(f"Processed {len(harness_eval_files)} harness file(s):")
            for i, file_info in enumerate(harness_eval_files):
                mock_stdout_lines.append(f"  - [{i+1}] {file_info['filename']} ({len(file_info['content'])} bytes)")
                # Example: if a test case file exists, show part of its content
                if "input" in file_info['filename'].lower() and i == 0: # Show content for first input file
                    mock_stdout_lines.append(f"    Content preview: {file_info['content'][:50]}{'...' if len(file_info['content']) > 50 else ''}")
        else:
            mock_stdout_lines.append("No harness files were provided.")

        final_stdout = "\n".join(mock_stdout_lines)

        result: ExecutionResult = {
            "status": "success",
            "stdout": final_stdout,
            "stderr": "", # No errors for successful mock
            "output": final_stdout, # For engines where 'output' is primary result
            "duration_ms": simulated_duration_ms,
            "memory_kb": simulated_memory_kb,
            "exit_code": 0,
            "error_message": None,
            "engine_specific_response": {
                "engine": "mock_engine_v1",
                "message": "Simulated execution completed without errors.",
                "language_requested": language,
                "version_requested": version or "latest",
                "harness_files_count": len(harness_eval_files) if harness_eval_files else 0,
            }
        }

    # Log exit: function returning result
    print("--- execute_code (mock) returning ---", flush=True)
    # Using json.dumps for a more readable dictionary output in logs
    print(json.dumps(result, indent=2, default=str), flush=True) # Using default=str for any non-serializable data if any
    print("-------------------------------------", flush=True)
    return result

# Example Usage (for testing this mock module directly):
if __name__ == "__main__":
    print("--- Simulating successful Python execution ---", flush=True)
    py_files = [
        ExecutionFile(filename="test_input.txt", content="1 2 3 4 5"),
        ExecutionFile(filename="helper_module.py", content="def helper(): return 42")
    ]
    py_result = execute_code(
        language="python",
        version="3.9",
        code_to_execute="print('Hello from user code!')\n# harness_eval_files should be accessible",
        harness_eval_files=py_files
    )
    import json
    print(json.dumps(py_result, indent=2))

    print("\n--- Simulating Python execution with 'error' in code ---", flush=True)
    py_error_result = execute_code(
        language="python",
        version="3.9",
        code_to_execute="print('This code will error')\nx = 1/0", # "error" is in the string "error"
        harness_eval_files=[]
    )
    print(json.dumps(py_error_result, indent=2))

    print("\n--- Simulating successful C++ execution ---", flush=True)
    cpp_result = execute_code(
        language="cpp",
        version="17",
        code_to_execute="#include <iostream>\nint main() { std::cout << \"Hello from C++!\" << std::endl; return 0; }",
        harness_eval_files=None
    )
    print(json.dumps(cpp_result, indent=2))