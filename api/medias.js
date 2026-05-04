



const medias = [
    {id: 1, type: "movie", title: "Inception"},
    {id: 2, type: "tv", title: "Breaking Bad"},
    {id: 3, type: "movie", title: "The Matrix"},
    {id: 4, type: "tv", title: "Game of Thrones"}
];

module.exports = (req, res) => {
    if (req.method === "GET") {
        return res.status(200).json({medias});
    }else{
        return res.status(405).json(
            {
                message: "Método não permitido"
            }
        );
    }
}