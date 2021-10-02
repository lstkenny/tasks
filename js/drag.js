export function dragStart(e) {
	const id = e.target.id
	e.dataTransfer.setData("text", id)
}
export function dragOver(e) {
	e.preventDefault()
	if (e.target.dataset.name === "list-item") {
		document.querySelectorAll(".drag-over").forEach(item => item.classList.remove("drag-over"))
		e.target.classList.add("drag-over")
	}
}
export function drop(e, callback) {
	e.preventDefault()
	const targetItem = e.target
	if (targetItem.dataset.name === "list-item") {
		const sourceElementId = e.dataTransfer.getData("text")
		const sourceItem = document.getElementById(sourceElementId)
		const sourceId = Number(sourceItem.dataset.id)
		const targetId = Number(targetItem.dataset.id)
		if (sourceId !== targetId) {
			return callback(sourceId, targetId)
		}
		// targetItem.insertAdjacentElement("afterend", sourceItem)
		// document.querySelectorAll(".list-item").forEach(item => item.classList.remove("drag-over"))
	}
}