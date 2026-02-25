export const getRandomName = () => {
    const animals: string[] = [
        "eagle",
        "falcon",
        "wolf",
        "lynx",
        "panther",
        "hawk",
        "owl",
        "raven",
        "fox",
        "deer",
    ];

    const colors: string[] = [
        "black",
        "white",
        "gray",
        "silver",
        "slate",
        "charcoal",
        "ivory",
        "onyx",
        "graphite",
        "iron",
    ];

    const elements: string[] = [
        "quantum",
        "matrix",
        "nexus",
        "vector",
        "flux",
        "cipher",
        "vertex",
        "protocol",
        "core",
        "signal",
    ];

    function getRandomItem<T>(list: T[]): T {
        const index = Math.floor(Math.random() * list.length);
        return list[index];
    }

    const randomAnimal = getRandomItem(animals);
    const randomColor = getRandomItem(colors);
    const randomElement = getRandomItem(elements);
    return `${randomColor}-${randomElement}-${randomAnimal}`;
};
