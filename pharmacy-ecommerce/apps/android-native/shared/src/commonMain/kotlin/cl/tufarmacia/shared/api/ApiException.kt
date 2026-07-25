package cl.tufarmacia.shared.api

class ApiException(
    message: String,
    val statusCode: Int? = null,
    val code: String? = null,
) : Exception(message)
