from app.utils.http_utils import HttpUtils, httpUtils
from fastapi import HTTPException

def test_create_to_large_result_success():
    # Act
    result = HttpUtils.create_to_large_result("File too large (max 10 MB)")

    # Assert
    assert isinstance(result, HTTPException)
    assert result.status_code == 413
    assert result.detail == "File too large (max 10 MB)"

def test_create_to_large_result_default_message():
    # Act
    result = HttpUtils.create_to_large_result()

    # Assert
    assert result.status_code == 413
    assert result.detail == "Content too large"

def test_create_exception_success():
    # Arrange
    error = ValueError("bad salary format")

    # Act
    result = httpUtils.create_exception_result(error)

    # Assert
    assert isinstance(result, HTTPException)
    assert result.status_code == 400
    assert result.detail == "bad salary format"

def test_create_exception_result_accepts_plain_message():
    # Act
    result = httpUtils.create_exception_result("Job missing description to score with")

    # Assert
    assert result.status_code == 400
    assert result.detail == "Job missing description to score with"

def test_create_exception_result_default_message():
    # Act
    result = httpUtils.create_exception_result()

    # Assert
    assert result.status_code == 400
    assert result.detail == "Something went wrong :("

def test_create_exception_result_default_empty_error():
    # Arrange
    error = ValueError()

    # Act
    result = httpUtils.create_exception_result(error)

    # Assert
    assert result.status_code == 400
    assert result.detail == "Something went wrong :("

def test_create_not_found_result_success():
    # Act
    result = HttpUtils.create_not_found_result("Profile not found")

    # Assert
    assert isinstance(result, HTTPException)
    assert result.status_code == 404
    assert result.detail == "Profile not found"

def test_create_not_found_result_default_message():
    # Act
    result = HttpUtils.create_not_found_result()

    # Assert
    assert result.status_code == 404
    assert result.detail == "Resource not found"

def test_create_unprocessable_result_success():
    # Act
    result = HttpUtils.create_unprocessable_result("Could not read file")

    # Assert
    assert isinstance(result, HTTPException)
    assert result.status_code == 422
    assert result.detail == "Could not read file"

def test_create_unprocessable_result_default_message():
    # Act
    result = HttpUtils.create_unprocessable_result()

    # Assert
    assert result.status_code == 422
    assert result.detail == "Unprocessable request"
