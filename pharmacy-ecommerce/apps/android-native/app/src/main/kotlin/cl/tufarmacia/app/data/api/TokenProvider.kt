package cl.tufarmacia.app.data.api

fun interface TokenProvider {
    suspend fun currentIdToken(): String?
}
