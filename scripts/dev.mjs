import { spawn } from "node:child_process";

const processes = [
  {
    name: "server",
    color: "\u001b[36m",
    proc: spawn("npm", ["run", "dev", "-w", "server"], {
      cwd: process.cwd(),
      shell: true,
      stdio: ["inherit", "pipe", "pipe"]
    })
  },
  {
    name: "web",
    color: "\u001b[33m",
    proc: spawn("npm", ["run", "dev", "-w", "web"], {
      cwd: process.cwd(),
      shell: true,
      stdio: ["inherit", "pipe", "pipe"]
    })
  }
];

const reset = "\u001b[0m";

const prefixLine = (name, color, chunk, isError = false) => {
  const text = chunk.toString();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (!line) {
      continue;
    }

    const stream = isError ? process.stderr : process.stdout;
    stream.write(`${color}[${name}]${reset} ${line}\n`);
  }
};

for (const { name, color, proc } of processes) {
  proc.stdout?.on("data", (chunk) => prefixLine(name, color, chunk));
  proc.stderr?.on("data", (chunk) => prefixLine(name, color, chunk, true));
}

const shutdown = () => {
  for (const { proc } of processes) {
    if (!proc.killed) {
      proc.kill("SIGINT");
    }
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

Promise.all(
  processes.map(
    ({ proc, name }) =>
      new Promise((resolve, reject) => {
        proc.on("exit", (code) => {
          if (code && code !== 0) {
            reject(new Error(`${name} exited with code ${code}`));
            return;
          }

          resolve(code);
        });
      })
  )
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    shutdown();
    process.exit(1);
  });
