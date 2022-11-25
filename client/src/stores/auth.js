import { ref, watch } from "vue"
import { defineStore } from "pinia"
import api, { login as _login } from "../api"
import jwt_decode from "jwt-decode"

export const useAuthStore = defineStore("auth", () => {
    const Tokens = ref({
        access: "",
        refresh: ""
    })

    if (localStorage.getItem("Tokens")) {
        Tokens.value = JSON.parse(localStorage.getItem("Tokens"))
    }

    watch(
        Tokens,
        (newTokens) => {
            localStorage.setItem("Tokens", JSON.stringify(newTokens))
        },
        { deep: true }
    )

    const authenticated = () => {
        return Tokens.value.access.length > 0 && Tokens.value.refresh.length > 0
    }

    const accessTokenExpired = () => {
        if (Tokens.value.access.length === 0) {
            return true
        }

        const { exp } = jwt_decode(Tokens.value.access)

        if (Date.now() >= exp * 1000) {
            return true 
        } else {
            return false
        }
    }

    const setAccessToken = (newToken) => {
        Tokens.value.access = newToken
    }

    const setRefreshToken = (newToken) => {
        Tokens.value.refresh = newToken
    }

    const updateAccessToken = async () => {
        await api.post("jwt/refresh/", {
            refresh: Tokens.value.refresh
        })
            .then((response) => {
                setAccessToken(response.data.access)
            })
            .catch((error) => {
                console.log(`API call error: ${error}`)
                return Promise.reject(error)
            })
    }

    const login = async (credentials) => {
        const data = await _login(credentials)

        setAccessToken(data.access)
        setRefreshToken(data.refresh)
    }

    return {
        Tokens,
        authenticated,
        accessTokenExpired,
        setAccessToken,
        setRefreshToken,
        updateAccessToken,
        login
    }
})
