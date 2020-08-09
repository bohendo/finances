import React, { useState, useContext } from 'react';
import { Event } from '@finances/types';

import { Grid, } from '@material-ui/core';

import { AccountContext } from "../accountContext";
import { EthTransactionLogsTable } from './TransactionLogsTable'
import { EthTransactionLogsFilter } from './TransactionLogsFilter'

export const EthTransactionLogs = (props: any) => {
  const accountContext = useContext(AccountContext);
  const [filteredTransactions, setFilteredTransactions] = useState([] as Array<Event>);

  return (
    <>
      <Grid item xs={12} md={3} lg={3}>
        <EthTransactionLogsFilter
          transactions={props.transactions}
          setFilteredTransactions={setFilteredTransactions}
        />
      </Grid>
      <Grid item xs={12} md={9} lg={9}>
        <EthTransactionLogsTable addressBook={accountContext.addressBook} filteredTransactions={filteredTransactions} />
      </Grid>
    </>
  )
}
