import PocketBase from "pocketbase";

const url = "https://sae-203-jumelages.tebrouri.fr";
const pb = new PocketBase(url);

const collArtiste = "artiste";
const collScene = "scene";
const collEquipe = "equipe";
const collPartenaire = "partenaire";
const collFaq = "faq";
const collContact = "contact";
const collUsers = "users";

const nomScenePrincipale = "La Scène Principale";
const nomEquipePrioritaire = "Sophie Marchand";

// Nettoyage des valeurs pour filtre
function cleanFilter(value) {
    const text = value ? value + "" : "";
    return text.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
}

// Formatage de la date
function formatDate(dateKey) {
    if (!dateKey) {
        return "";
    }

    return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    });
}

// Extraction date et heure
function getDateHeure(dateTimeText) {
    const text = (dateTimeText ? dateTimeText + "" : "").trim();

    if (!text) {
        return { dateKey: "", heure: "" };
    }

    const morceaux = text.split(" ");
    const dateKey = morceaux[0] || "";
    const heureComplete = morceaux[1] || "";
    const heureMorceaux = heureComplete.split(":");

    if (heureMorceaux[0] && heureMorceaux[1]) {
        return {
            dateKey,
            heure: `${heureMorceaux[0]}:${heureMorceaux[1]}`
        };
    }

    return { dateKey, heure: "" };
}

// URL des fichiers PocketBase
function getFileUrl(collection, id, fileName) {
    if (!id || !fileName) {
        return "";
    }

    return `${url}/api/files/${collection}/${id}/${fileName}`;
}

// Vérification du type d'entité
function getEntityCollection(entityType) {
    const type = ((entityType || "") + "").toLowerCase();

    if (type !== collArtiste && type !== collScene) {
        throw new Error("entityType doit être 'artiste' ou 'scene'.");
    }

    return type;
}

// Détail artiste pour le front
function toArtisteDetail(artiste) {
    const datePerformance = artiste && artiste.date_performance ? artiste.date_performance : "";
    const dateInfo = getDateHeure(datePerformance);
    const dateKey = dateInfo.dateKey;
    const heure = dateInfo.heure;
    const nom = artiste && artiste.nom ? artiste.nom + "" : "Artiste";

    let imgSource = null;
    if (artiste && artiste.img) {
        imgSource = artiste.img;
    }

    const imageFiles = Array.isArray(imgSource)
        ? artiste.img.map((file) => (file ? file + "" : "").trim()).filter(Boolean)
        : imgSource
            ? [(artiste.img + "").trim()].filter(Boolean)
            : [];

    let sceneNom = "";
    if (artiste && artiste.expand && artiste.expand.scene && artiste.expand.scene.nom) {
        sceneNom = artiste.expand.scene.nom + "";
    }

    const artisteId = artiste && artiste.id ? artiste.id + "" : "";

    return {
        id: artisteId,
        nom,
        slug: artisteSlug(nom),
        genre: artiste && artiste.genre ? artiste.genre + "" : "",
        description: artiste && artiste.description ? artiste.description + "" : "",
        date: formatDate(dateKey),
        heure,
        scene: sceneNom,
        img: imageFiles,
        imageUrls: imageFiles.map((fileName) => `${getFileUrl(collArtiste, artisteId, fileName)}?thumb=1200x0`),
        record: {
            id: artisteId,
            collectionName: collArtiste,
            img: imageFiles
        }
    };
}

// Slug artiste
export function artisteSlug(nom) {
    return ((nom || "") + "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// Client PocketBase
export function getPocketBaseClient() {
    return pb;
}

// Liste des artistes par date
export async function allArtistesByDate() {
    return pb.collection(collArtiste).getFullList({
        sort: "date_performance",
        expand: "scene"
    });
}

// Programmation groupée par jour
export async function homepageProgrammation() {
    try {
        const artistes = await allArtistesByDate();
        const grouped = {};

        for (const artiste of artistes) {
            const dateInfo = getDateHeure(artiste.date_performance);
            const dateKey = dateInfo.dateKey;
            const heure = dateInfo.heure;

            if (!dateKey) {
                continue;
            }

            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    label: formatDate(dateKey),
                    items: []
                };
            }

            let sceneNom = "";
            if (artiste.expand && artiste.expand.scene && artiste.expand.scene.nom) {
                sceneNom = artiste.expand.scene.nom + "";
            }

            grouped[dateKey].items.push({
                id: artiste.id ? artiste.id + "" : "",
                nom: artiste.nom ? artiste.nom + "" : "Artiste",
                heure,
                scene: sceneNom,
                img: artiste.img ? artiste.img + "" : "",
                record: {
                    id: artiste.id ? artiste.id + "" : "",
                    collectionName: collArtiste,
                    img: artiste.img ? artiste.img + "" : ""
                }
            });
        }

        return Object.values(grouped);
    } catch {
        return [];
    }
}

// Liste des artistes pour carousel
export async function homepageArtistesCarousel() {
    try {
        const artistes = await allArtistesByDate();

        return artistes.map((artiste) => {
            const dateInfo = getDateHeure(artiste.date_performance);
            const dateKey = dateInfo.dateKey;
            let sceneNom = "";
            if (artiste.expand && artiste.expand.scene && artiste.expand.scene.nom) {
                sceneNom = artiste.expand.scene.nom + "";
            }

            return {
                id: artiste.id ? artiste.id + "" : "",
                nom: artiste.nom ? artiste.nom + "" : "Artiste",
                slug: artisteSlug(artiste.nom ? artiste.nom + "" : "Artiste"),
                scene: sceneNom,
                date: formatDate(dateKey),
                heure: dateInfo.heure,
                record: {
                    id: artiste.id ? artiste.id + "" : "",
                    collectionName: collArtiste,
                    img: artiste.img ? artiste.img + "" : ""
                }
            };
        });
    } catch {
        return [];
    }
}

// Liste des scènes par nom
export async function allScenesByName() {
    return pb.collection(collScene).getFullList({
        sort: "nom"
    });
}

// Liste des partenaires par création
export async function allPartenairesByCreated() {
    return pb.collection(collPartenaire).getFullList({
        sort: "created",
        fields: "id,nom,lien,logo"
    });
}

// Partenaires pour le front
export async function homepagePartenaires() {
    try {
        const records = await allPartenairesByCreated();

        return records.map((partenaire) => ({
            id: partenaire.id ? partenaire.id + "" : "",
            nom: partenaire.nom ? partenaire.nom + "" : "",
            lien: partenaire.lien ? partenaire.lien + "" : undefined,
            logo: partenaire.logo ? partenaire.logo + "" : undefined
        }));
    } catch {
        return [];
    }
}

// Liste FAQ par création
export async function allFaqByCreated() {
    return pb.collection(collFaq).getFullList({
        sort: "created",
        fields: "id,question,reponse"
    });
}

// FAQ pour le front
export async function homepageFaq() {
    try {
        const records = await allFaqByCreated();

        return records.map((item) => ({
            id: item.id ? item.id + "" : "",
            question: item.question ? item.question + "" : "",
            reponse: item.reponse ? item.reponse + "" : ""
        }));
    } catch {
        return [];
    }
}

// URL logo partenaire
export function partenaireLogoUrl(partenaire) {
    const id = partenaire && partenaire.id ? partenaire.id : "";
    const logo = partenaire && partenaire.logo ? partenaire.logo : "";
    return getFileUrl(collPartenaire, id, logo);
}

// Scène principale pour le front
export async function homepageScenePrincipale() {
    try {
        const sceneName = cleanFilter(nomScenePrincipale);
        const scene = await pb.collection(collScene).getFirstListItem(`nom = "${sceneName}"`, {
            fields: "id,nom,img,description,localisation,capacite"
        });

        return {
            id: scene.id ? scene.id + "" : "",
            collectionName: collScene,
            nom: scene.nom ? scene.nom + "" : "",
            img: scene.img ? scene.img + "" : "",
            description: scene.description ? scene.description + "" : "",
            localisation: scene.localisation ? scene.localisation + "" : "",
            capacite: scene.capacite !== undefined ? scene.capacite : null
        };
    } catch {
        return null;
    }
}

// URL image scène
export function sceneImgUrl(scene) {
    const id = scene && scene.id ? scene.id : "";
    const img = scene && scene.img ? scene.img : "";
    return getFileUrl(collScene, id, img);
}

// Équipe pour le front
export async function homepageEquipe() {
    try {
        const records = await pb.collection(collEquipe).getFullList({
            sort: "nom",
            fields: "id,nom,role,img"
        });

        const membres = records.map((membre) => ({
            id: membre.id ? membre.id + "" : "",
            collectionName: collEquipe,
            nom: membre.nom ? membre.nom + "" : "",
            role: membre.role ? membre.role + "" : "",
            img: membre.img ? membre.img + "" : ""
        }));

        membres.sort((a, b) => {
            if (a.nom === nomEquipePrioritaire) {
                return -1;
            }

            if (b.nom === nomEquipePrioritaire) {
                return 1;
            }

            return a.nom.localeCompare(b.nom, "fr");
        });

        return membres;
    } catch {
        return [];
    }
}

// Liste des artistes par ordre alphabétique
export async function allArtistesAlphabet() {
    return pb.collection(collArtiste).getFullList({
        sort: "nom",
        expand: "scene"
    });
}

// Artiste par id
export async function artisteById(id) {
    return pb.collection(collArtiste).getOne(id, {
        expand: "scene"
    });
}

// Détail artiste par id
export async function homepageArtisteById(id) {
    try {
        if (!id) {
            return null;
        }

        const artiste = await artisteById(id);
        return toArtisteDetail(artiste);
    } catch {
        return null;
    }
}

// Détail artiste par slug ou id
export async function homepageArtisteBySlugOrId(value) {
    try {
        if (!value) {
            return null;
        }

        const artisteByPocketbaseId = await homepageArtisteById(value);
        if (artisteByPocketbaseId) {
            return artisteByPocketbaseId;
        }

        const targetSlug = artisteSlug(value);
        if (!targetSlug) {
            return null;
        }

        const artistes = await allArtistesByDate();
        const foundArtiste = artistes.find((artiste) => {
            const nom = artiste && artiste.nom ? artiste.nom : "";
            return artisteSlug(nom) === targetSlug;
        });

        if (!foundArtiste) {
            return null;
        }

        return toArtisteDetail(foundArtiste);
    } catch {
        return null;
    }
}

// Scène par id
export async function sceneById(id) {
    return pb.collection(collScene).getOne(id);
}

// Artistes par id de scène
export async function artistesBySceneId(idScene) {
    const sceneId = cleanFilter(idScene);

    return pb.collection(collArtiste).getFullList({
        filter: `scene = "${sceneId}"`,
        sort: "date_performance",
        expand: "scene"
    });
}

// Artistes par nom de scène
export async function artistesBySceneName(nomScene) {
    const sceneName = cleanFilter(nomScene);

    return pb.collection(collArtiste).getFullList({
        filter: `scene.nom = "${sceneName}"`,
        sort: "date_performance",
        expand: "scene"
    });
}

// Ajout artiste
export async function addArtiste(data) {
    return pb.collection(collArtiste).create(data);
}

// Modification artiste
export async function updateArtiste(id, data) {
    return pb.collection(collArtiste).update(id, data);
}

// Ajout scène
export async function addScene(data) {
    return pb.collection(collScene).create(data);
}

// Modification scène
export async function updateScene(id, data) {
    return pb.collection(collScene).update(id, data);
}

// Ajout message contact
export async function addContactMessage(data) {
    return pb.collection(collContact).create(data);
}

// Sauvegarde entité
export async function saveEntity(entityType, data, id = null) {
    const collection = getEntityCollection(entityType);

    if (id) {
        return pb.collection(collection).update(id, data);
    }

    return pb.collection(collection).create(data);
}

// Connexion utilisateur
export async function loginUser(email, password) {
    if (!email || !password) {
        throw new Error("email et password sont requis.");
    }

    const authData = await pb.collection(collUsers).authWithPassword(email, password);

    return {
        token: authData.token,
        user: authData.record
    };
}

// Inscription utilisateur
export async function registerUser(nom, email, password) {
    return pb.collection(collUsers).create({
        name: nom,
        email,
        password,
        passwordConfirm: password,
        emailVisibility: true
    });
}

// Déconnexion utilisateur
export function logoutUser() {
    pb.authStore.clear();
}
