from fastapi import HTTPException

class HttpUtils():
    @staticmethod
    def create_to_large_result(message: str = "Content too large") -> HTTPException:
        '''
        Creates a 413 response.
        '''
        return HTTPException(413, message)

    @staticmethod
    def create_exception_result(error: Exception | str = "Something went wrong :(") -> HTTPException:
        '''
        Creates a 400 response surfacing the given error.
        '''
        return HTTPException(400, str(error) or "Something went wrong :(")

    @staticmethod
    def create_not_found_result(message: str = "Resource not found") -> HTTPException:
        '''
        Creates a 404 response.
        '''
        return HTTPException(404, message)

    @staticmethod
    def create_unprocessable_result(message: str = "Unprocessable request") -> HTTPException:
        '''
        Creates a 422 response.
        '''
        return HTTPException(422, message)

httpUtils = HttpUtils()