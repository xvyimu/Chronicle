set shell := ["pwsh", "-NoProfile", "-Command"]

default:
    @just --list

install:
    pnpm install

dev:
    pnpm dev

lint:
    pnpm lint

format-check:
    pnpm format:check

typecheck:
    pnpm typecheck

test:
    pnpm test

e2e:
    pnpm test:e2e

build:
    pnpm build

check: lint format-check typecheck test
