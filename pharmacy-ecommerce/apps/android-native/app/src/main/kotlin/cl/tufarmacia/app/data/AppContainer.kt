package cl.tufarmacia.app.data

import android.content.Context
import cl.tufarmacia.app.BuildConfig
import cl.tufarmacia.app.data.api.TuFarmaciaApi
import cl.tufarmacia.app.data.auth.FirebaseAuthApi
import cl.tufarmacia.app.data.auth.SessionRepository
import cl.tufarmacia.app.data.cart.CartRepository
import java.util.UUID

class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    private val sessionStore = DataStoreSessionStore(appContext)
    private val authApi = FirebaseAuthApi(apiKey = BuildConfig.FIREBASE_API_KEY)

    val cartRepository = CartRepository(appContext)

    /** Stable guest session id for pickup API (persisted lightly in memory per process). */
    val guestSessionId: String = UUID.randomUUID().toString()

    val sessionRepository = SessionRepository(
        authApi = authApi,
        store = sessionStore,
        apiFactory = { tokenProvider ->
            TuFarmaciaApi(
                baseUrl = BuildConfig.API_BASE_URL,
                tokenProvider = tokenProvider,
            )
        },
    )

    val api: TuFarmaciaApi get() = sessionRepository.api()
}
