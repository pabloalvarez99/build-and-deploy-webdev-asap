package cl.tufarmacia.shared.api

/** Supplies a Firebase ID token for Authorization: Bearer on API calls. */
fun interface TokenProvider {
    suspend fun currentIdToken(): String?
}
