import e from "express";
import validateStructure, { setDataKeys } from "../data_writer.mjs";
import path from "path";

const app = e()
app.set('view engine', 'ejs');
app.set('views', './admin_service/views');
app.use(e.static('./admin_service/public'));
app.use(e.json())

app.get('/', (req, res) => {
  validateStructure()
  res.render('index', {})
});

app.post("/update_data", (req, res) => {
  req.addListener("data", (json) => {
    const data = JSON.parse(json)
    console.log(data)
    console.log(data["steamcmd_path"])
    const pairs = {
      "steamcmd_dir": path.dirname(data["steamcmd_path"]),
      "cluster_token": data["cluster_token"],
      "game_files_dir": path.dirname(data["gamefiles"]),
      "clusters_dir": path.dirname(data["cluster_folder"]),
    }
    setDataKeys(pairs)
    res.redirect("/")
  })
})

app.listen(4000)