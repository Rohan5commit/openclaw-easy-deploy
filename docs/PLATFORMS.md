# Platforms

| Platform | Typical Cost | Difficulty | Notes |
|---|---:|---:|---|
| Render | Free/starter tiers available | Low | Fastest managed route if Render API token is ready. |
| DigitalOcean | Starts around $6/mo | Medium | More infra control; you manage Droplet baseline/security. |
| Custom VPS | Varies by provider | High | Maximum flexibility, requires SSH and Linux operations. |
| Local Docker | No cloud cost | Low | Great for local testing; not ideal for internet-facing production. |

## Recommendation

- First-time deployers: use `Render`.
- Power users with infra familiarity: use `DigitalOcean` or `Custom VPS`.
- Local prototyping only: use `Local Docker`.

## References

- DigitalOcean community OpenClaw guide: https://www.digitalocean.com/community/tutorials/how-to-run-openclaw
- Render docs: https://render.com/docs
