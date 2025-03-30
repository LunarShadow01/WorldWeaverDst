
export function Main({steamcmd_dir}) {

  const data = `
    <div>
      <label>steamcmd dir:</label>
      <input type="file" id="steamcmd_input"
        webkitdirectory value=${steamcmd_dir} />
    </div>
  `.trim()

  data.getElementByID("steamcmd_input").addListener("onChange", () => {
    console.log("test")
  })
  
  return data
}