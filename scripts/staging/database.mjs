// Fly's pinned backup restore can swallow launcher errors. Check the Machines
// API instead of treating a successful CLI exit as a ready database.
export async function waitForDatabase(listMachines, {
  attempts = 270,
  deadline = Date.now() + 45 * 60_000,
  pause = () => new Promise(resolve => setTimeout(resolve, 10_000)),
} = {}) {
  for (let attempt = 0; attempt < attempts && Date.now() < deadline; attempt++) {
    const machines = await listMachines();
    if (machines.length === 0) throw new Error("Database restore created no machine; staging launch stopped before SQL preparation");
    if (machines.some(machine => machine.state === "started" && machine.checks?.some(check =>
      check.name === "role" && check.status === "passing" && ["leader", "primary"].includes(check.output?.trim())
    ))) return;
    if (attempt + 1 < attempts) await pause();
  }
  throw new Error("Database restore did not produce a ready primary before the restore deadline; staging launch stopped before SQL preparation");
}

// Return only fixed labels, never provider output, SQL text, or credentials.
export function flyFailureReason(output, timedOut = false, operation = "") {
  if (timedOut) return "command deadline exceeded";
  if (/no active leader found/i.test(output)) return "no ready database primary";
  if (/create ssh certificate|failed to issue.*certificate/i.test(output)) return "SSH certificate creation failed";
  if (/error connecting to SSH server|failed to connect.*wireguard/i.test(output)) return "private-network SSH connection failed";
  if (/password authentication failed/i.test(output)) return "database authentication failed";
  if (/permission denied|unauthorized|not authorized/i.test(output)) return "permission denied";
  if (/ERROR:.*(?:relation|column).*does not exist/i.test(output)) return "database schema does not match the preparation SQL";
  if (/timed out|timeout/i.test(output)) return "provider operation timed out";
  if (operation === "deploy") {
    for (const [pattern, reason] of [
      [/dockerfile.*(?:not found|does not exist)|failed to read dockerfile|unable to load dockerfile/i, "deployment Dockerfile not found"],
      [/failed to (?:load|parse).*config|invalid.*configuration|configuration.*invalid/i, "deployment configuration invalid"],
      [/failed to resolve.*image|pull access denied/i, "container image resolution failed"],
      [/failed to solve|error building|failed to build|build failed/i, "container build failed"],
      [/release command.*(?:failed|non-zero)|migration.*failed|P30\d{2}/i, "release migration failed"],
      [/health checks.*failed|smoke checks.*failed|failed to become healthy/i, "application health checks failed"],
      [/out of memory|oom kill/i, "deployment ran out of memory"],
    ]) if (pattern.test(output)) return reason;
    return "application deployment failed";
  }
  if (/ERROR:|FATAL:/i.test(output)) return "provider reported an error";
  return "provider command failed";
}
