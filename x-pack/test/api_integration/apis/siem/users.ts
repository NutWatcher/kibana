/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';
import { usersQuery } from '../../../../plugins/siem/public/containers/users/index.gql_query';
import {
  Direction,
  UsersFields,
  FlowTarget,
  GetUsersQuery,
} from '../../../../plugins/siem/public/graphql/types';
import { KbnTestProvider } from './types';

const FROM = new Date('2000-01-01T00:00:00.000Z').valueOf();
const TO = new Date('3000-01-01T00:00:00.000Z').valueOf();
const IP = '0.0.0.0';

const usersTests: KbnTestProvider = ({ getService }) => {
  const esArchiver = getService('esArchiver');
  const client = getService('siemGraphQLClient');
  describe('Users', () => {
    describe('With auditbeat', () => {
      before(() => esArchiver.load('auditbeat/default'));
      after(() => esArchiver.unload('auditbeat/default'));

      it('Ensure data is returned from auditbeat', () => {
        return client
          .query<GetUsersQuery.Query>({
            query: usersQuery,
            variables: {
              sourceId: 'default',
              timerange: {
                interval: '12h',
                to: TO,
                from: FROM,
              },
              defaultIndex: ['auditbeat-*', 'filebeat-*', 'packetbeat-*', 'winlogbeat-*'],
              ip: IP,
              flowTarget: FlowTarget.destination,
              sort: { field: UsersFields.name, direction: Direction.asc },
              pagination: {
                limit: 10,
                cursor: null,
              },
            },
          })
          .then(resp => {
            const users = resp.data.source.Users;
            expect(users.edges.length).to.be(1);
            expect(users.totalCount).to.be(1);
            expect(users.edges[0].node.user!.id).to.eql(['0']);
            expect(users.edges[0].node.user!.name).to.be('root');
            expect(users.edges[0].node.user!.groupId).to.eql(['0']);
            expect(users.edges[0].node.user!.groupName).to.eql(['root']);
            expect(users.edges[0].node.user!.count).to.be(1);
          });
      });
    });
  });
};

// eslint-disable-next-line import/no-default-export
export default usersTests;
