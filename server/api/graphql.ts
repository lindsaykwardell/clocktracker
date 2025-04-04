import { Alignment, Resolvers, RoleType } from "#graphql/resolver";
import { typeDefs } from "#graphql/schema";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateH3Handler } from "@as-integrations/h3";
import { PrismaClient } from "@prisma/client";
import { roleStats } from "../utils/stats";
import { getRoleId } from "../utils/getRoleId";

const prisma = new PrismaClient();

const resolvers: Resolvers = {
  Query: {
    // Get roles with optional filtering and pagination
    roles: async (_, { ids, offset, limit, type, scriptId }) => {
      return [];
    },

    // Get a single role by ID
    role: async (_, { id, withIds }) => {
      const roleId = await getRoleId(id);

      if (!roleId) {
        throw createError({
          status: 404,
          message: "Role not found",
        });
      }

      const _withIds = [];

      if (withIds) {
        for (const id of withIds) {
          const roleId = await getRoleId(id);
          if (roleId) {
            _withIds.push(roleId);
          }
        }
      }

      const stats = await roleStats(roleId, {
        withIds: _withIds ?? undefined,
      });
      return {
        ...stats.role,
        customRole: stats.role.custom_role,
        type: stats.role.type as unknown as RoleType,
        tokenUrl: stats.role.token_url,
        initialAlignment: stats.role.initial_alignment as unknown as Alignment,
        alternateTokenUrls: stats.role.alternate_token_urls,
        winLoss: stats.win_loss,
        popularScripts: stats.popular_scripts,
        gamesByMonth: stats.games_by_month,
        count: stats.count,
      };
    },

    // Get scripts with optional filtering and pagination
    scripts: async (_, { offset, limit, roles }) => {
      // TODO: Implement scripts query with filters
      return [];
    },

    // Get a single script by ID
    script: async (_, { id }) => {
      // TODO: Implement script query
      return null;
    },
  },

  Role: {
    // Resolve any field that might need custom resolution
    initialAlignment: async (parent) => {
      // TODO: Implement initialAlignment resolver if needed
      return parent.initialAlignment;
    },
    type: async (parent) => {
      // TODO: Implement type resolver if needed
      return parent.type;
    },
    popularScripts: async (parent, { limit }) => {
      if (!parent.popularScripts) return null;

      if (limit && limit >= 0) {
        return parent.popularScripts.slice(0, limit);
      }

      return parent.popularScripts;
    },
  },

  Script: {
    // Resolve the roles field for Script type
    roles: async (parent) => {
      // TODO: Implement roles resolver for Script
      return [];
    },
  },
};

const apollo = new ApolloServer({ typeDefs, resolvers });

export default startServerAndCreateH3Handler(apollo);
