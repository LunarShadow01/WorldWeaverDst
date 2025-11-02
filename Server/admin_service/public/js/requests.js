
const steamcmd_input = document.getElementById("input_steamcmd")
const token_input = document.getElementById("input_token")
const gamefiles_input = document.getElementById("input_gamefiles")
const saves_input = document.getElementById("input_saves")
const update_button = document.getElementById("update_button")

function UpdateData() {
  const data = {
    steamcmd_path: steamcmd_input.value,
    cluster_token: token_input.value,
    gamefiles: gamefiles_input.value,
    cluster_folder: saves_input.value
  }

  for (const key in data) {
    if (data[key] == undefined) {
      data[key] = ""
    }
  }

  fetch("/update_data", {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

update_button.addEventListener("click", UpdateData)