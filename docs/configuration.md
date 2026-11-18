# Configuration

Back to the [README](../README.md).

## Where the office keeps things

The office keeps its data in `~/agent-office` (`--home` or `AGENT_OFFICE_HOME` to move it) and clones projects next to it, as `~/agent-office/<owner>/<repo>`. To clone them somewhere else, like `~/Workspace`, an admin picks the **Workspace folder** in ⚙️ Settings → **🏢 Building** (or start with `--projects` or `AGENT_OFFICE_PROJECTS`). Floors you already have stay where they are, and a checkout of the same repository that's already in the new folder is used as it is. The building's map is in `~/agent-office/.agent-office/map.json`, and maps of your own go in `~/agent-office/.agent-office/maps/` (see [Maps](maps.md)). The list of floors is `~/agent-office/.agent-office/floors.json`, and each account's own Claude and GitHub sign-ins are in `~/agent-office/.agent-office/homes/<account>/` (revoking the account deletes them). Each floor keeps its workers, queue, pictures and worktrees in its own checkout's `.agent-office/`.

Already have a checkout? Pick its repository anyway: a checkout of it that's already where the workspace folder would clone it is used as it is. You can still start the office in a project, `agent-office ~/code/my-project`: that project becomes a floor, and the office keeps its data in `~/code/my-project/.agent-office` as it did before there were floors. An office that already ran in a project carries on in it when you start `agent-office` there again. An admin can take that project off the building in the elevator like any other floor.

## Command line

```
agent-office [dir] [options]

      --home <dir>        Where the office keeps its data without a [dir] (default ~/agent-office)
      --projects <dir>    Where new floors are cloned, as <dir>/<owner>/<repo> (default ~/agent-office;
                          also settable from ⚙️ Settings)
  -p, --port <n>          Port (default 4600, env PORT)
  -H, --host <addr>       Bind address (default 127.0.0.1; 0.0.0.0 lets your network in)
      --password <pw>     Office password (env AGENT_OFFICE_PASSWORD)
      --no-open           Don't open the office in your browser when it starts
      --agent <cmd>       Default agent command (default "claude")
      --agent-args <str>  Extra args for the configured agent, e.g. "--model opus"
      --dsh-profile <n>   DeepSeek Harness profile over ACP (default "acp")
      --tls-cert <file>   Serve HTTPS with this cert…
      --tls-key <file>    …and key
      --self-signed       Serve HTTPS with a generated self-signed cert
      --trust-proxy       Trust X-Forwarded-* (behind Caddy/nginx)
      --turn <url>        Add a TURN server for voice, e.g. turn:user:pass@host:3478
                          (env AGENT_OFFICE_TURN, several separated by spaces)
      --budget <usd>      Daily tracked Claude Code budget (OpenCode/Codex/Grok/Muse/DSH excluded)
      --budget-pause      ...and nobody can hire a new worker until the next day
      --max-workers <n>   Run at most n workers at once, across every floor (env AGENT_OFFICE_MAX_WORKERS)
      --webhook <url>     Post to this Slack / Discord webhook when a worker needs input or finishes
      --city <name>       Put the office in a real city: its sun and live weather (open-meteo.com)
      --weather <kind>    Pin the weather: clear, cloudy, rain, storm, snow or fog
      --real-time-sky     Start the sky on the real clock, not a day an hour (env AGENT_OFFICE_SKY_CLOCK=real; ⚙️ Settings can switch it)

agent-office setup [--projects <dir>] [--project <owner/repo>]... [--home <dir>]

  The first-start walkthrough again: the workspace folder, GitHub sign-in and
  repositories to clone as floors. With --projects / --project it asks nothing.
  Run it while the office is stopped.

agent-office prune [dir] [-n|--dry-run] [-f|--force]

  Removes leftover worker worktrees under .agent-office/worktrees/ and their
  office/* branches, in one floor's checkout (dir). Anything with uncommitted changes or unpushed commits is
  kept unless --force is given. A worker across several projects has worktrees of them in its
  own floor's workspace: prune each project to clear those out.

agent-office accounts [list | invite [name] [--admin] | revoke <name> | role <name> admin|member | password on|off] [-d <dir>]

  Invite, list and revoke people's own accounts, and switch the shared password
  off or on. Works while the office runs.

agent-office tunnel [office@address | url] [--port <n>] [--office-port <n>] [--name <name>] [--password <pw>] [--no-open] [--insecure] [-- <ssh options>]

  On your own computer, for an office that runs somewhere else: every web server
  a worker starts there opens on the same port here, by itself, and closes when
  the worker stops it. Given an SSH address it opens the tunnel to the office too.
  See docs/tunnel.md.
```

## Autopilot

A floor queues a task of its own on a timer when its project has an `agent-office.autopilot.json` at the top of the checkout (commit it, so it goes wherever the project does):

```json
{
  "everyMinutes": 240,
  "title": "Next video",
  "prompt": "You are the lead. Read docs/lead.md and start the next piece of work.",
  "quietHours": [1, 7],
  "owner": "omar"
}
```

| Key | What it does |
| --- | --- |
| `everyMinutes` | Minutes from one task being queued to the next, 15 or more. A new one is only queued once the last one is done. |
| `prompt` | The task the queue gets. |
| `title` | Its title on the queue (`Autopilot` without one). |
| `quietHours` | `[from, to)` hours, 0 to 23 on the office machine's clock, wrapping past midnight, when nothing is queued. |
| `owner` | With accounts, the account whose Claude and GitHub sign-ins the task runs on. |
| `enabled` | `false` turns it off. |

When it last queued is kept in the floor's `.agent-office/autopilot.json`, so a restart doesn't run it early. The task goes through the queue like any other, so the queue's *workers at once*, the office's worker limit and the daily budget all apply.


## Language

The office shows in **Spanish**. Its own words (menus, windows, hints, toasts, the sign-in page) are swapped for Spanish in the browser as they appear, from the dictionary in `src/client/i18n/` (`es-*.ts` for exact texts, `patterns.ts` for sentences with a name or number in them). Terminals, code and what people type are never translated, and text the dictionary doesn't know stays in English. Words painted into the 3D world (signs, the arcade) stay in English too.

Open the office with `?lang=en` to switch that browser back to English, and `?lang=es` to return to Spanish; the choice is kept in the browser.
