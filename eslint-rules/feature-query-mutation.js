const FEATURE_QUERY_PATH =
  /(?:^|\/)src\/features\/[^/]+\/queries\/[^/]+\.query\.ts$/u;
const FEATURE_MUTATION_PATH =
  /(?:^|\/)src\/features\/[^/]+\/mutations\/[^/]+\.mutation\.ts$/u;
const FEATURE_API_PATH =
  /(?:^|\/)src\/features\/[^/]+\/apis\/[^/]+\.router\.ts$/u;

const FEATURE_QUERY_DIR = /(?:^|\/)src\/features\/[^/]+\/queries\//u;
const FEATURE_MUTATION_DIR = /(?:^|\/)src\/features\/[^/]+\/mutations\//u;
const FEATURE_API_DIR = /(?:^|\/)src\/features\/[^/]+\/apis\//u;
const SCHEMA_DIR = /(?:^|\/)schemas\//u;
const FEATURE_DIR = /(?:^|\/)src\/features\//u;
const ROUTER_FN_NAME = "createTRPCRouter";
const KEBAB_CASE_SEGMENT = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

const normalizeFilename = (filename) => filename.replaceAll("\\", "/");
const getBasename = (filename) => filename.split("/").at(-1) ?? filename;

const shouldSkipFileNameCase = (filename) => {
  return (
    /(?:^|\/)src\/routes\//u.test(filename) ||
    /(?:^|\/)src\/routeTree\.gen\.ts$/u.test(filename) ||
    /(?:^|\/)src\/router\.tsx$/u.test(filename) ||
    filename.endsWith(".d.ts")
  );
};

const isKebabCaseFileName = (basename) => {
  const name = basename.replace(/\.[^.]+$/u, "");

  return name.split(".").every((segment) => KEBAB_CASE_SEGMENT.test(segment));
};

const isCreateRouterCall = (node) => {
  return (
    node?.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === ROUTER_FN_NAME
  );
};

const isFunctionLikeDeclaration = (node) => {
  if (!node) {
    return false;
  }

  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression" ||
    node.type === "CallExpression"
  );
};

const getFileKind = (filename) => {
  if (FEATURE_QUERY_PATH.test(filename)) {
    return {
      kind: "query",
      suffix: "Query",
      expectedPath: "src/features/<feature>/queries/*.query.ts",
    };
  }

  if (FEATURE_MUTATION_PATH.test(filename)) {
    return {
      kind: "mutation",
      suffix: "Mutation",
      expectedPath: "src/features/<feature>/mutations/*.mutation.ts",
    };
  }

  return undefined;
};

const getExpectedPathForName = (name) => {
  if (name.endsWith("Query")) {
    return "src/features/<feature>/queries/*.query.ts";
  }

  if (name.endsWith("Mutation")) {
    return "src/features/<feature>/mutations/*.mutation.ts";
  }

  return undefined;
};

const isInExpectedPathForName = (name, filename) => {
  if (name.endsWith("Query")) {
    return FEATURE_QUERY_PATH.test(filename);
  }

  if (name.endsWith("Mutation")) {
    return FEATURE_MUTATION_PATH.test(filename);
  }

  return true;
};

const featureQueryMutationPlugin = {
  rules: {
    "query-mutation-conventions": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Enforce feature query and mutation file locations and exported function names.",
        },
        messages: {
          invalidQueryFilePath:
            "Query files must live in src/features/<feature>/queries and end with .query.ts.",
          invalidMutationFilePath:
            "Mutation files must live in src/features/<feature>/mutations and end with .mutation.ts.",
          invalidRouterFilePath:
            "API router files must live in src/features/<feature>/apis and end with .router.ts.",
          invalidSchemaFilePath:
            "Schema files must end with .shared-schema.ts or .schema.ts.",
          invalidKebabFileName:
            "Non-TSX file '{{filename}}' must be kebab-case.",
          invalidFunctionName:
            "{{kind}} function '{{name}}' must end with '{{suffix}}'.",
          invalidFunctionPath: "'{{name}}' must live in {{expectedPath}}.",
          tooManyRouters: "Only one router is allowed per router file.",
        },
        schema: [],
      },
      create(context) {
        const filename = normalizeFilename(context.filename);
        const fileKind = getFileKind(filename);
        const declarations = new Map();
        const exportedRouterNames = new Set();

        const checkFileNameCase = (node) => {
          if (shouldSkipFileNameCase(filename)) {
            return;
          }

          const basename = getBasename(filename);

          if (basename.endsWith(".tsx")) {
            return;
          }

          if (
            /\.(?:[cm]?[jt]s|css)$/u.test(basename) &&
            !isKebabCaseFileName(basename)
          ) {
            context.report({
              node,
              messageId: "invalidKebabFileName",
              data: {
                filename: basename,
              },
            });
          }
        };

        const checkFunctionPath = (node, name) => {
          const expectedPath = getExpectedPathForName(name);

          if (!expectedPath || isInExpectedPathForName(name, filename)) {
            return;
          }

          context.report({
            node,
            messageId: "invalidFunctionPath",
            data: {
              name,
              expectedPath,
            },
          });
        };

        const checkFileKindFunction = (node, name) => {
          if (!fileKind || name.endsWith(fileKind.suffix)) {
            return;
          }

          context.report({
            node,
            messageId: "invalidFunctionName",
            data: {
              kind: fileKind.kind,
              name,
              suffix: fileKind.suffix,
            },
          });
        };

        const checkRouter = (node, name) => {
          if (!FEATURE_DIR.test(filename)) {
            return;
          }

          if (!FEATURE_API_PATH.test(filename)) {
            context.report({
              node,
              messageId: "invalidRouterFilePath",
            });

            return;
          }

          if (exportedRouterNames.size > 0 && !exportedRouterNames.has(name)) {
            context.report({
              node,
              messageId: "tooManyRouters",
            });
          }

          exportedRouterNames.add(name);
        };

        return {
          Program(node) {
            checkFileNameCase(node);

            if (
              FEATURE_QUERY_DIR.test(filename) &&
              !filename.endsWith(".query.ts")
            ) {
              context.report({ node, messageId: "invalidQueryFilePath" });
            }

            if (
              FEATURE_MUTATION_DIR.test(filename) &&
              !filename.endsWith(".mutation.ts")
            ) {
              context.report({ node, messageId: "invalidMutationFilePath" });
            }

            if (
              FEATURE_API_DIR.test(filename) &&
              !filename.endsWith(".router.ts")
            ) {
              context.report({ node, messageId: "invalidRouterFilePath" });
            }

            if (
              SCHEMA_DIR.test(filename) &&
              !filename.endsWith(".schema.ts") &&
              !filename.endsWith(".shared-schema.ts") &&
              !filename.endsWith(".relations.ts")
            ) {
              context.report({ node, messageId: "invalidSchemaFilePath" });
            }

            if (
              FEATURE_DIR.test(filename) &&
              filename.endsWith(".query.ts") &&
              !FEATURE_QUERY_PATH.test(filename)
            ) {
              context.report({ node, messageId: "invalidQueryFilePath" });
            }

            if (
              FEATURE_DIR.test(filename) &&
              filename.endsWith(".mutation.ts") &&
              !FEATURE_MUTATION_PATH.test(filename)
            ) {
              context.report({ node, messageId: "invalidMutationFilePath" });
            }

            if (
              FEATURE_DIR.test(filename) &&
              filename.endsWith(".router.ts") &&
              !FEATURE_API_PATH.test(filename)
            ) {
              context.report({ node, messageId: "invalidRouterFilePath" });
            }
          },
          FunctionDeclaration(node) {
            if (!node.id) {
              return;
            }

            declarations.set(node.id.name, {
              node: node.id,
              usesCreateRouter: false,
            });
            checkFunctionPath(node.id, node.id.name);
          },
          VariableDeclarator(node) {
            if (
              node.id.type !== "Identifier" ||
              !node.init ||
              (!isFunctionLikeDeclaration(node.init) &&
                !isCreateRouterCall(node.init))
            ) {
              return;
            }

            declarations.set(node.id.name, {
              node: node.id,
              usesCreateRouter: isCreateRouterCall(node.init),
            });
            checkFunctionPath(node.id, node.id.name);
          },
          ExportNamedDeclaration(node) {
            if (node.declaration?.type === "FunctionDeclaration") {
              const name = node.declaration.id?.name;

              if (name) {
                checkFileKindFunction(node.declaration.id, name);
              }
            }

            if (node.declaration?.type === "VariableDeclaration") {
              for (const declaration of node.declaration.declarations) {
                if (
                  declaration.id.type === "Identifier" &&
                  declaration.init &&
                  isFunctionLikeDeclaration(declaration.init)
                ) {
                  checkFileKindFunction(declaration.id, declaration.id.name);
                }

                if (
                  declaration.id.type === "Identifier" &&
                  declaration.init &&
                  isCreateRouterCall(declaration.init)
                ) {
                  checkRouter(declaration.id, declaration.id.name);
                }
              }
            }

            for (const specifier of node.specifiers) {
              const name = specifier.local.name;
              const declaration = declarations.get(name);

              if (declaration) {
                checkFileKindFunction(specifier.local, name);
              }

              if (declaration?.usesCreateRouter || name.endsWith("Router")) {
                checkRouter(specifier.local, name);
              }
            }
          },
        };
      },
    },
  },
};

export default featureQueryMutationPlugin;
