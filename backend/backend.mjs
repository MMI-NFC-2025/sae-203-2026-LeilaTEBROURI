import PocketBase from "pocketbase";

const POCKETBASE_URL = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
const pb = new PocketBase(POCKETBASE_URL);

const COLLECTIONS = {
    artiste: "artiste",
    scene: "scene",
    partenaire: "partenaire",
    users: "users"
};

function escapeFilterValue(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
}

function getCollectionName(entityType) {
    const key = String(entityType ?? "").toLowerCase();
    if (key !== COLLECTIONS.artiste && key !== COLLECTIONS.scene) {
        throw new Error("entityType doit être 'artiste' ou 'scene'.");
    }

    return key;
}

export function getPocketBaseClient() {
    return pb;
}



// Liste des artistes par date
export async function allArtistesByDate() {
    return pb.collection(COLLECTIONS.artiste).getFullList({
        sort: "date_performance",
        expand: "scene"
    });
}



// Liste des scènes par nom
export async function allScenesByName() {
    return pb.collection(COLLECTIONS.scene).getFullList({
        sort: "nom"
    });
}



// Liste des partenaires
export async function allPartenairesByCreated() {
    return pb.collection(COLLECTIONS.partenaire).getFullList({
        sort: "created",
        fields: "id,nom,lien,logo"
    });
}



// Liste partenaires prête pour le front
export async function homepagePartenaires() {
    try {
        const records = await allPartenairesByCreated();

        return records.map((partenaire) => ({
            id: partenaire.id,
            nom: String(partenaire.nom ?? ""),
            lien: partenaire.lien ? String(partenaire.lien) : undefined,
            logo: partenaire.logo ? String(partenaire.logo) : undefined
        }));
    } catch {
        return [];
    }
}



// URL logo partenaire
export function partenaireLogoUrl(partenaire) {
    if (!partenaire?.logo || !partenaire?.id) {
        return "";
    }

    return `${POCKETBASE_URL}/api/files/${COLLECTIONS.partenaire}/${partenaire.id}/${partenaire.logo}`;
}



// Liste artistes ordre alphaphabetique
export async function allArtistesAlphabet() {
    return pb.collection(COLLECTIONS.artiste).getFullList({
        sort: "nom",
        expand: "scene"
    });
}



// Infos artiste par ID
export async function artisteById(id) {
    return pb.collection(COLLECTIONS.artiste).getOne(id, {
        expand: "scene"
    });
}



// Infos scene par ID
export async function sceneById(id) {
    return pb.collection(COLLECTIONS.scene).getOne(id);
}



// Artistes par scene ID
export async function artistesBySceneId(idScene) {
    const safeSceneId = escapeFilterValue(idScene);

    return pb.collection(COLLECTIONS.artiste).getFullList({
        filter: `scene = "${safeSceneId}"`,
        sort: "date_performance",
        expand: "scene"
    });
}



// Artistes par nom de scene
export async function artistesBySceneName(nomScene) {
    const safeSceneName = escapeFilterValue(nomScene);

    return pb.collection(COLLECTIONS.artiste).getFullList({
        filter: `scene.nom = "${safeSceneName}"`,
        sort: "date_performance",
        expand: "scene"
    });
}



// Ajouter artiste
export async function addArtiste(data) {
    return pb.collection(COLLECTIONS.artiste).create(data);
}



// Modifier artiste
export async function updateArtiste(id, data) {
    return pb.collection(COLLECTIONS.artiste).update(id, data);
}



// Ajouter scène
export async function addScene(data) {
    return pb.collection(COLLECTIONS.scene).create(data);
}



// Modifier scène
export async function updateScene(id, data) {
    return pb.collection(COLLECTIONS.scene).update(id, data);
}

export async function saveEntity(entityType, data, id = null) {
    const collectionName = getCollectionName(entityType);

    if (id) {
        return pb.collection(collectionName).update(id, data);
    }

    return pb.collection(collectionName).create(data);
}

export async function loginUser(email, password) {
    if (!email || !password) {
        throw new Error("email et password sont requis.");
    }

    const authData = await pb.collection(COLLECTIONS.users).authWithPassword(email, password);

    return {
        token: authData.token,
        user: authData.record
    };
}

export function logoutUser() {
    pb.authStore.clear();
}
