// Fly's pinned backup restore can swallow launcher errors. Check the Machines
// API instead of treating a successful CLI exit as a ready database.
export async function waitForDatabase(listMachines, {
  attempts = 90,
  pause = () => new Promise(resolve => setTimeout(resolve, 10_000)),
} = {}) {
  const deadline = Date.now() + 15 * 60_000;
  for (let attempt = 0; attempt < attempts && Date.now() < deadline; attempt++) {
    const machines = await listMachines();
    if (machines.length === 0) throw new Error("Database restore created no machine; staging launch stopped before SQL preparation");
    if (machines.some(machine => machine.state === "started" && machine.checks?.some(check =>
      check.name === "role" && check.status === "passing" && ["leader", "primary"].includes(check.output?.trim())
    ))) return;
    if (attempt + 1 < attempts) await pause();
  }
  throw new Error("Database restore did not produce a ready primary within 15 minutes; staging launch stopped before SQL preparation");
}

// Return only fixed labels, never provider output, SQL text, or credentials.
export function flyFailureReason(output, timedOut = false) {
  if (timedOut) return "command deadline exceeded";
  if (/no active leader found/i.test(output)) return "no ready database primary";
  if (/create ssh certificate|failed to issue.*certificate/i.test(output)) return "SSH certificate creation failed";
  if (/error connecting to SSH server|failed to connect.*wireguard/i.test(output)) return "private-network SSH connection failed";
  if (/password authentication failed/i.test(output)) return "database authentication failed";
  if (/permission denied|unauthorized|not authorized/i.test(output)) return "permission denied";
  if (/ERROR:.*(?:relation|column).*does not exist/i.test(output)) return "database schema does not match the preparation SQL";
  if (/ERROR:|FATAL:/i.test(output)) return "database reported an error";
  if (/timed out|timeout/i.test(output)) return "provider operation timed out";
  return "provider command failed";
}
