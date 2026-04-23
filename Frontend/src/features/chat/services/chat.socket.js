import { io } from "socket.io-client";
import { SOCKET_URL } from "../../../app/api";

let socketInstance = null;

export const initializeSocketConnection = () => {
    if (socketInstance?.connected) {
        return socketInstance;
    }

    socketInstance = io(SOCKET_URL, {
        withCredentials: true,
    })

    socketInstance.on("connect", () => {
        console.log("Connected to Socket.IO server")
    })

    return socketInstance;
}
