from fastapi import HTTPException

class HttpUtils():
    def create_to_large_result(message: str = "Content too large") -> HTTPException:
        '''
        Creates a 413 response.
        '''
        return HTTPException(413, message)
    
    def create_exception_result(message: str = "Something went wrong :(") -> HTTPException:
        '''
        Creates a 400 response.
        '''
        return HTTPException(400, message)
    
    def create_not_found_result(message: str = "Resource not found") -> HTTPException:
        '''
        Creates a 404 response.
        '''
        return HTTPException(404, message)
    
    def create__result(message: str = "Unprocessable request") -> HTTPException:
        '''
        Creates a 422 response.
        '''
        return HTTPException(422, message)

httpUtils = HttpUtils()