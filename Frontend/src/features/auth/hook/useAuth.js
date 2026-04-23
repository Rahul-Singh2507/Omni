import { useDispatch } from "react-redux";
import { register, login, getMe } from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";

function getAuthErrorMessage(error, fallbackMessage) {
    const responseData = error.response?.data;

    if (responseData?.message) {
        return responseData.message;
    }

    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
        return responseData.errors[ 0 ]?.msg || fallbackMessage;
    }

    return fallbackMessage;
}


export function useAuth() {


    const dispatch = useDispatch()

    async function handleRegister({ email, username, password }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await register({ email, username, password })
            return {
                success: true,
                data,
            }
        } catch (error) {
            dispatch(setError(getAuthErrorMessage(error, "Registration failed")))
            return {
                success: false,
                error,
            }
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await login({ email, password })
            dispatch(setUser(data.user))
            return {
                success: true,
                data,
            }
        } catch (err) {
            dispatch(setError(getAuthErrorMessage(err, "Login failed")))
            return {
                success: false,
                error: err,
            }
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleGetMe() {
        try {
            dispatch(setLoading(true))
            const data = await getMe()
            dispatch(setUser(data.user))
        } catch (err) {
            dispatch(setUser(null))

            if (err.response?.status !== 401) {
                dispatch(setError(getAuthErrorMessage(err, "Failed to fetch user data")))
            }
        } finally {
            dispatch(setLoading(false))
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleGetMe,
    }

}
