# KickLink

Mobile-first platform that unifies Sunday-league and grassroots football organisation.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
- Copy `.env.example` to `.env` in both `packages/api` and `packages/mobile`
- Update with your Supabase and Stripe credentials

3. Start the development servers:
```bash
# Start API server
pnpm dev

# In another terminal, start mobile app
cd packages/mobile && pnpm start
```

## Project Structure

- `packages/mobile`: React Native (Expo) mobile app
- `packages/api`: Express API gateway
- `packages/shared`: Shared types and schemas
- `supabase/`: Database migrations and edge functions

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter mobile test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Private - All rights reserved