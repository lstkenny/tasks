class Task {
	id
	parentId
	title
	description
	done
	due
	constructor(data) {
		this.id = data.id || Date.now()
		this.parentId = data.parentId || null
		this.title = data.title || ""
		this.description = data.description || ""
		this.done = data.done || false
		this.due = data.due || Date.now() + 24 * 60 * 60 * 1000
	}
}

export default Task