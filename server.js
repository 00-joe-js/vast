// kaboom dev server

const fs = require("fs");
const esbuild = require("esbuild");
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;
let err = null;

// build user game
function buildGame() {

	const template = fs.readFileSync("template.html", "utf-8");
	let code = "";

	code += `<script src="/game.js"></script>\n`;

	try {
		// build user code
		esbuild.buildSync({
			bundle: true,
			sourcemap: true,
			target: "es6",
			keepNames: true,
			logLevel: "silent",
			entryPoints: ["code/main.js"],
			outfile: "docs/game.js",
		});

	} catch (e) {
		const loc = e.errors[0].location;
		err = {
			msg: e.errors[0].text,
			stack: [
				{
					line: loc.line,
					col: loc.column,
					file: loc.file,
				},
			],
		};
		let msg = "";
		msg += "<pre>";
		msg += `ERROR: ${err.msg}\n`;
		if (err.stack) {
			err.stack.forEach((trace) => {
				msg += `    -> ${trace.file}:${trace.line}:${trace.col}\n`;
			});
		}
		msg += "</pre>";
		fs.writeFileSync("docs/index.html", msg);
		return;
	}

	fs.writeFileSync("docs/index.html", template);

}

// server stuff
app.use(express.json({ strict: false }));

app.get("/", (req, res) => {
	err = null;
	buildGame();
	res.sendFile(__dirname + "/docs/index.html");
});

app.use(express.static("docs"));

server.listen(port);
