import {
    allArtistesByDate,
    allScenesByName,
    allArtistesAlphabet,
    artisteById,
    sceneById,
    artistesBySceneId,
    artistesBySceneName,
    saveEntity,
    loginUser,
    logoutUser
} from "./backend.mjs";


let artistesByDate = [];
let scenesByName = [];

// Test artistes triés par date
try {
    console.log("=== Artistes par date ===");
    artistesByDate = await allArtistesByDate();
    console.log(artistesByDate);
} catch (e) {
    console.error(e);
}


// Test scènes triées par nom
try {
    console.log("=== Scenes par nom ===");
    scenesByName = await allScenesByName();
    console.log(scenesByName);
} catch (e) {
    console.error(e);
}


// Test artistes ordre alphabet
try {
    console.log("=== Artistes alphabet ===");
    console.log(await allArtistesAlphabet());
} catch (e) {
    console.error(e);
}


// Test artiste par ID
try {
    console.log("=== Artiste par ID ===");
    const artisteId = artistesByDate[0]?.id;

    if (!artisteId) {
        throw new Error("Aucun ID artiste disponible.");
    }

    console.log(await artisteById(artisteId));
} catch (e) {
    console.error(e);
}


// Test scene par ID
try {
    console.log("=== Scene par ID ===");
    const sceneId = scenesByName[0]?.id;

    if (!sceneId) {
        throw new Error("Aucun ID scène disponible.");
    }

    console.log(await sceneById(sceneId));
} catch (e) {
    console.error(e);
}


// Test artistes par scene ID
try {
    console.log("=== Artistes par scene ID ===");
    const sceneId = scenesByName[0]?.id;

    if (!sceneId) {
        throw new Error("Aucun ID scène disponible.");
    }

    console.log(await artistesBySceneId(sceneId));
} catch (e) {
    console.error(e);
}


// Test artistes par nom scene
try {
    console.log("=== Artistes par nom scene ===");
    const sceneName = scenesByName[0]?.nom;

    if (!sceneName) {
        throw new Error("Aucun nom de scène disponible.");
    }

    console.log(await artistesBySceneName(sceneName));
} catch (e) {
    console.error(e);
}


// Test saveEntity (validation type)
try {
    console.log("=== saveEntity validation ===");
    await saveEntity("invalide", {});
} catch (e) {
    console.log("Erreur attendue:", e.message);
}


// Test login users (optionnel)
try {
    console.log("=== Login users (optionnel) ===");
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
        console.log("SKIP: définir TEST_USER_EMAIL et TEST_USER_PASSWORD pour tester la connexion.");
    } else {
        const auth = await loginUser(email, password);
        console.log({
            userId: auth.user?.id,
            email: auth.user?.email,
            hasToken: Boolean(auth.token)
        });
        logoutUser();
    }
} catch (e) {
    console.error(e);
}

