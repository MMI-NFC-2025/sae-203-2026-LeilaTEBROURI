import {
    allArtistesByDate,
    allScenesByName,
    allPartenairesByCreated,
    homepagePartenaires,
    homepageProgrammation,
    homepageArtistesCarousel,
    homepageArtisteById,
    homepageArtisteBySlugOrId,
    allArtistesAlphabet,
    artisteById,
    artisteSlug,
    sceneById,
    artistesBySceneId,
    artistesBySceneName,
    partenaireLogoUrl,
    saveEntity,
    loginUser,
    logoutUser
} from "./backend.mjs";


let artistesByDate = [];
let scenesByName = [];
let partenairesByCreated = [];

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


// Test partenaires triés par date de création
try {
    console.log("=== Partenaires par date de création ===");
    partenairesByCreated = await allPartenairesByCreated();
    console.log(partenairesByCreated);
} catch (e) {
    console.error(e);
}


// Test URL logo partenaire
try {
    console.log("=== URL logo partenaire ===");
    const partenaire = partenairesByCreated[0];

    if (!partenaire) {
        throw new Error("Aucun partenaire disponible.");
    }

    console.log(partenaireLogoUrl(partenaire));
} catch (e) {
    console.error(e);
}


// Test partenaires format front
try {
    console.log("=== Partenaires format front ===");
    console.log(await homepagePartenaires());
} catch (e) {
    console.error(e);
}


// Test programmation format front
try {
    console.log("=== Programmation format front ===");
    console.log(await homepageProgrammation());
} catch (e) {
    console.error(e);
}


// Test artistes carousel format front
try {
    console.log("=== Artistes carousel format front ===");
    console.log(await homepageArtistesCarousel());
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


// Test détail artiste format front par ID
try {
    console.log("=== Détail artiste format front ===");
    const artisteId = artistesByDate[0]?.id;

    if (!artisteId) {
        throw new Error("Aucun ID artiste disponible.");
    }

    console.log(await homepageArtisteById(artisteId));
} catch (e) {
    console.error(e);
}


// Test détail artiste format front par slug (nom)
try {
    console.log("=== Détail artiste format front par slug ===");
    const artisteNom = artistesByDate[0]?.nom;

    if (!artisteNom) {
        throw new Error("Aucun nom artiste disponible.");
    }

    const slug = artisteSlug(artisteNom);
    console.log({ slug, artisteNom });
    console.log(await homepageArtisteBySlugOrId(slug));
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

