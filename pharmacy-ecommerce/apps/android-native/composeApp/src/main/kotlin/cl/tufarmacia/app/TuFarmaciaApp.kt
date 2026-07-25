package cl.tufarmacia.app

import android.app.Application
import cl.tufarmacia.app.data.AppContainer

class TuFarmaciaApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
