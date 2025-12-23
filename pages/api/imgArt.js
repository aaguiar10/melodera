import { Vibrant } from 'node-vibrant/node'

export default async function handler (req, res) {
  // Get Image Colors
  if (req.headers?.authorization) {
    var img = req.query.img
    await Vibrant.from(img)
      .getPalette()
      .then(palette => res.status(200).json(palette))
      .catch(error => {
        console.error(error)
        res.status(500).send(error)
      })
  } else {
    res.status(401).send({ error: 'No token provided' })
  }
}
