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

async function checkSession() {
    const token = localStorage.getItem("duesly_token")
    if (!token) {
        return false
    }
    try {
        const response = await fetch(API_URL + "/auth/me", {
           headers: {Authorization:"Bearer " + token }
        })
        if (response.ok) {
            const data = await response.json();
            return data.user || data;
        }
        localStorage.removeItem("duesly_token")
        return false;
    } catch (error) {
        return false
    }
    
}

async function getHostel() {
    const token = localStorage.getItem("duesly_token");
    const answer = await fetch(API_URL + "/hostel", {
      headers: { Authorization: "Bearer " + token },
    });

    const data = await answer.json()
return data.hostel;
}

async function saveHostel(hostelName, headName) {
    const token = localStorage.getItem("duesly_token");
    const answer = await fetch(API_URL + "/hostel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ name: hostelName, head_name: headName }),
    });
    const data = await answer.json();
    if (!answer.ok) {
        throw new Error(data.error);
    }
    return data.hostel;
}

async function updateHostel(hostelName, headName) {
    const token = localStorage.getItem("duesly_token");
    const answer = await fetch(API_URL + "/hostel", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ name: hostelName, head_name: headName }),
    });
    const data = await answer.json();
    if (!answer.ok) {
        throw new Error(data.error);
    }
    return data.hostel;
}

function signOut() {
    localStorage.removeItem("duesly_token");
}


async function requestReset(email) {
    const data = await callServer("/auth/forgot-password", { email });
    return data.message;
}
async function resetPassword(token, password) {
    const data = await callServer("/auth/reset-password", { token, password });
    return data.message;
}