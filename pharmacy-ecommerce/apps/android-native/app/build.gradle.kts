plugins {
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinAndroid)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinSerialization)
}

android {
    namespace = "cl.tufarmacia.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "cl.tufarmacia.native"
        minSdk = 26
        targetSdk = 35
        versionCode = 21
        versionName = "1.12.0"

        buildConfigField("String", "API_BASE_URL", "\"https://tu-farmacia.cl\"")
        buildConfigField(
            "String",
            "FIREBASE_API_KEY",
            "\"AIzaSyC9k3tw3ckVIim5G9K6lxX1exOb7LdqnRU\""
        )
        buildConfigField("String", "FIREBASE_PROJECT_ID", "\"tu-farmacia-prod\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    val composeBom = platform(libs.compose.bom)
    implementation(composeBom)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    implementation(libs.activity.compose)
    implementation(libs.navigation.compose)
    implementation(libs.lifecycle.runtime)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.coroutines.android)
    implementation(libs.datastore.preferences)
    implementation(libs.coil.compose)
    implementation(libs.serialization.json)

    // Camera barcode (POS / inventory)
    implementation(libs.camerax.core)
    implementation(libs.camerax.camera2)
    implementation(libs.camerax.lifecycle)
    implementation(libs.camerax.view)
    implementation(libs.mlkit.barcode)

    // Pure Android networking (Kotlin + OkHttp engine)
    implementation(libs.ktor.client.core)
    implementation(libs.ktor.client.okhttp)
    implementation(libs.ktor.client.content.negotiation)
    implementation(libs.ktor.serialization.json)
    implementation(libs.ktor.client.logging)

    debugImplementation(libs.compose.ui.tooling)
}
