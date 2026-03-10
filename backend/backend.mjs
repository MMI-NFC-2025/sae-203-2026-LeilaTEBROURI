import PocketBase from "pocketbase";

const POCKETBASE_URL = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
const pb = new PocketBase(POCKETBASE_URL);

const COLLECTIONS = {
    artiste: "artiste",
    scene: "scene",
    equipe: "equipe",
    partenaire: "partenaire",
    faq: "faq",
    users: "users"
};

const SCENE_PRINCIPALE_NAME = "La Scène Principale";
const EQUIPE_FIRST_MEMBER_NAME = "Sophie Marchand";

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

/**
 * @typedef {Object} HomepageProgrammationItem
 * @property {string} id
 * @property {string} nom
 * @property {string} heure
 * @property {string} scene
 * @property {string} img
 * @property {{ id: string, collectionName: string, img: string }} record
 */

/**
 * @typedef {Object} HomepageProgrammationGroup
 * @property {string} label
 * @property {HomepageProgrammationItem[]} items
 */



// Programmation artistes prête pour le front (groupée par date + heure)
export async function homepageProgrammation() {
    try {
        const artistes = await allArtistesByDate();

        /** @type {Record<string, HomepageProgrammationGroup>} */
        const groupedProgrammation = artistes.reduce((groups, artiste) => {
            const rawDateTime = String(artiste.date_performance ?? "");
            const dateKey = rawDateTime.slice(0, 10);
            const heure = rawDateTime.slice(11, 16);

            if (!dateKey) {
                return groups;
            }

            if (!groups[dateKey]) {
                const formattedDate = new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC"
                });

                groups[dateKey] = {
                    label: formattedDate,
                    items: []
                };
            }

            groups[dateKey].items.push({
                id: String(artiste.id ?? ""),
                nom: String(artiste.nom ?? "Artiste"),
                heure,
                scene: String(artiste.expand?.scene?.nom ?? ""),
                img: artiste.img ? String(artiste.img) : "",
                record: {
                    id: String(artiste.id ?? ""),
                    collectionName: COLLECTIONS.artiste,
                    img: artiste.img ? String(artiste.img) : ""
                }
            });

            return groups;
        }, {});

        return Object.values(groupedProgrammation);
    } catch {
        /** @type {HomepageProgrammationGroup[]} */
        return [];
    }
}



// Liste artistes prête pour un carousel (date + heure + scène)
export async function homepageArtistesCarousel() {
    try {
        const artistes = await allArtistesByDate();

        return artistes.map((artiste) => {
            const rawDateTime = String(artiste.date_performance ?? "");
            const dateKey = rawDateTime.slice(0, 10);
            const heure = rawDateTime.slice(11, 16);

            const date = dateKey
                ? new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC"
                })
                : "";

            return {
                id: String(artiste.id ?? ""),
                nom: String(artiste.nom ?? "Artiste"),
                scene: String(artiste.expand?.scene?.nom ?? ""),
                date,
                heure,
                record: {
                    id: String(artiste.id ?? ""),
                    collectionName: COLLECTIONS.artiste,
                    img: artiste.img ? String(artiste.img) : ""
                }
            };
        });
    } catch {
        return [];
    }
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



// Liste FAQ triée par création
export async function allFaqByCreated() {
    return pb.collection(COLLECTIONS.faq).getFullList({
        sort: "created",
        fields: "id,question,reponse"
    });
}



// FAQ prête pour le front
export async function homepageFaq() {
    try {
        const records = await allFaqByCreated();

        return records.map((item) => ({
            id: String(item.id ?? ""),
            question: String(item.question ?? ""),
            reponse: String(item.reponse ?? "")
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



// Infos scène principale prêtes pour le front
export async function homepageScenePrincipale() {
    try {
        const safeSceneName = escapeFilterValue(SCENE_PRINCIPALE_NAME);
        const scene = await pb.collection(COLLECTIONS.scene).getFirstListItem(
            `nom = "${safeSceneName}"`,
            {
                fields: "id,nom,img,description,localisation,capacite"
            }
        );

        return {
            id: scene.id,
            collectionName: COLLECTIONS.scene,
            nom: String(scene.nom ?? ""),
            img: scene.img ? String(scene.img) : "",
            description: scene.description ? String(scene.description) : "",
            localisation: scene.localisation ? String(scene.localisation) : "",
            capacite: scene.capacite ?? null
        };
    } catch {
        return null;
    }
}



// URL image scène
export function sceneImgUrl(scene) {
    if (!scene?.img || !scene?.id) {
        return "";
    }

    return `${POCKETBASE_URL}/api/files/${COLLECTIONS.scene}/${scene.id}/${scene.img}`;
}



// Liste équipe prête pour le front
export async function homepageEquipe() {
    try {
        const records = await pb.collection(COLLECTIONS.equipe).getFullList({
            sort: "nom",
            fields: "id,nom,role,img"
        });

        const membres = records.map((membre) => ({
            id: membre.id,
            collectionName: COLLECTIONS.equipe,
            nom: String(membre.nom ?? ""),
            role: String(membre.role ?? ""),
            img: membre.img ? String(membre.img) : ""
        }));

        membres.sort((firstMember, secondMember) => {
            if (firstMember.nom === EQUIPE_FIRST_MEMBER_NAME) {
                return -1;
            }

            if (secondMember.nom === EQUIPE_FIRST_MEMBER_NAME) {
                return 1;
            }

            return firstMember.nom.localeCompare(secondMember.nom, "fr");
        });

        return membres;
    } catch {
        return [];
    }
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



// Détail artiste prêt pour le front
export async function homepageArtisteById(id) {
    try {
        if (!id) {
            return null;
        }

        const artiste = await artisteById(id);
        const rawDateTime = String(artiste.date_performance ?? "");
        const dateKey = rawDateTime.slice(0, 10);
        const heure = rawDateTime.slice(11, 16);

        const dateLabel = dateKey
            ? new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "UTC"
            })
            : "";

        return {
            id: String(artiste.id ?? ""),
            nom: String(artiste.nom ?? "Artiste"),
            genre: String(artiste.genre ?? ""),
            description: String(artiste.description ?? ""),
            date: dateLabel,
            heure,
            scene: String(artiste.expand?.scene?.nom ?? ""),
            img: artiste.img ? String(artiste.img) : "",
            record: {
                id: String(artiste.id ?? ""),
                collectionName: COLLECTIONS.artiste,
                img: artiste.img ? String(artiste.img) : ""
            }
        };
    } catch {
        return null;
    }
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
