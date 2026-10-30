const API_URL = "http://localhost:3000";
async function callServer(path, body) {
    const response = await fetch(API_URL + path, {
        method: "POST",
        headers: {
            "Content-Type":
            "application/json"
        },
        body:JSON.stringify(body)
    })
    const data = await response.json()
    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    } 
    return data;
}
async function signUp(full_name, email, password) {
    const data = await callServer("/auth/signup", { full_name, email, password });
    localStorage.setItem("duesly_token", data.token);
    return data.user;
}
async function signIn(email, password) {
    const data = await callServer("/auth/signin", { email, password });
    localStorage.setItem("duesly_token", data.token);
    return data.user;
}
async function requestReset(email) {
    const data = await callServer("/auth/forgot-password", { email });
    return data.message;
}
async function resetPassword(token, password) {
    const data = await callServer("/auth/reset-password", { token, password });
    return data.message;
}