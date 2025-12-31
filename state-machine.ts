import { assign, createActor, createMachine } from "xstate";

const toggleMachine = createMachine({
  id: "toggle",
  initial: "Inactive",
  context: {
    count: 0,
  },
  states: {
    Inactive: {
      on: { toggle: "Active" },
    },
    Active: {
      on: { toggle: "Inactive" },
      after: {
        2000: "Inactive",
      },
      entry: assign({
        count: ({ context }) => context.count + 1,
      }),
    },
  },
});

const actor = createActor(toggleMachine);
actor.start();

actor.subscribe((state) => {
  console.log(`Current state: ${JSON.stringify(state, null, 2)}`);
});

actor.send({ type: "toggle" });
actor.send({ type: "toggle" });
