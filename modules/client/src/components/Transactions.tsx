import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Collapse from "@material-ui/core/Collapse";
import Divider from "@material-ui/core/Divider";
import FormControl from "@material-ui/core/FormControl";
import IconButton from "@material-ui/core/IconButton";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import SyncIcon from "@material-ui/icons/Sync";
import ClearIcon from "@material-ui/icons/Delete";
import { describeTransaction } from "@valuemachine/transactions";
import {
  AddressBook,
  AddressCategories,
  Assets,
  CsvSources,
  Transaction,
  Transactions,
  TransactionsJson,
  TransactionSources,
  Transfer,
} from "@valuemachine/types";
import { round } from "@valuemachine/utils";
import React, { useEffect, useState } from "react";
import axios from "axios";

import { HexString } from "./HexString";
import { InputDate } from "./InputDate";

const useStyles = makeStyles((theme: Theme) => createStyles({
  row: {
    "& > *": {
      borderBottom: "unset",
    },
  },
  button: {
    margin: theme.spacing(3),
  },
  spinner: {
    padding: "0",
  },
  importer: {
    margin: theme.spacing(4),
  },
  select: {
    margin: theme.spacing(3),
    minWidth: 160,
  },
  title: {
    marginBottom: theme.spacing(0),
  },
  subtitle: {
    margin: theme.spacing(2),
  },
  paper: {
    minWidth: "850px",
    padding: theme.spacing(2),
  },
  dateFilter: {
    margin: theme.spacing(2),
  },
}));

const TransactionRow = ({
  addressBook,
  tx,
}: {
  addressBook: AddressBook;
  tx: Transaction;
}) => {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  return (
    <React.Fragment>
      <TableRow className={classes.row}>
        <TableCell> {
          (new Date(tx.date)).toISOString().replace("T", " ").replace(".000Z", "")
        } </TableCell>
        <TableCell> {describeTransaction(addressBook, tx)} </TableCell>
        <TableCell> {tx.hash ? <HexString value={tx.hash} /> : "N/A"} </TableCell>
        <TableCell> {tx.sources.join(", ")} </TableCell>
        <TableCell onClick={() => setOpen(!open)} style={{ minWidth: "140px" }}>
          {`${tx.transfers.length} transfer${tx.transfers.length === 1 ? "" : "s"}`}
          <IconButton aria-label="expand row" size="small" >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box pb={2} px={4}>
              <Typography variant="h6" gutterBottom component="div">
                Transfers
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong> Category </strong></TableCell>
                    <TableCell><strong> Asset </strong></TableCell>
                    <TableCell><strong> Amount </strong></TableCell>
                    <TableCell><strong> From </strong></TableCell>
                    <TableCell><strong> To </strong></TableCell>
                    <TableCell><strong> Index </strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tx.transfers.map((transfer: Transfer, i: number) => (
                    <TableRow key={i}>
                      <TableCell> {transfer.category} </TableCell>
                      <TableCell> {transfer.asset} </TableCell>
                      <TableCell> {round(transfer.quantity, 4)} </TableCell>
                      <TableCell>
                        <HexString
                          display={addressBook?.getName(transfer.from)}
                          value={transfer.from}
                        />
                      </TableCell>
                      <TableCell>
                        <HexString
                          display={addressBook?.getName(transfer.to)}
                          value={transfer.to}
                        />
                      </TableCell>
                      <TableCell> {transfer.index} </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

export const TransactionExplorer = ({
  addressBook,
  transactions,
  setTransactions,
}: {
  addressBook: AddressBook;
  transactions: Transactions;
  setTransactions: (val: Transactions) => void;
}) => {
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const [filterAccount, setFilterAccount] = useState("");
  const [filterAsset, setFilterAsset] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");

  const [filteredTxns, setFilteredTxns] = useState([] as TransactionsJson);

  const [ourAssets, setOurAssets] = useState([]);

  const [importFileType, setImportFileType] = useState("");
  const classes = useStyles();

  const hasAccount = (account: string) => (tx: Transaction): boolean =>
    !account
    || tx.transfers.some(t => t.from === account)
    || tx.transfers.some(t => t.to === account);

  const hasAsset = (asset: Assets) => (tx: Transaction): boolean =>
    !asset || tx.transfers.some(t => t.asset === asset);

  const hasSource = (source: TransactionSources) => (tx: Transaction): boolean =>
    !source
    || (tx?.sources || []).includes(source)
    || tx.transfers.some(t => addressBook.getName(t.from).startsWith(source))
    || tx.transfers.some(t => addressBook.getName(t.to).startsWith(source));

  useEffect(() => {
    const getDate = (timestamp: string): string =>
      (new Date(timestamp)).toISOString().split("T")[0];
    setPage(0);
    setFilteredTxns(transactions?.json
      .filter(tx => !filterStartDate || getDate(tx.date) >= getDate(filterStartDate))
      .filter(tx => !filterEndDate || getDate(tx.date) <= getDate(filterEndDate))
      .filter(hasAsset(filterAsset))
      .filter(hasAccount(filterAccount))
      .filter(hasSource(filterSource))
      .sort((e1: Transaction, e2: Transaction) =>
        (e1.date > e2.date) ? -1 : (e1.date < e2.date) ? 1 : 0
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addressBook, transactions,
    filterAccount, filterAsset, filterSource, filterStartDate, filterEndDate,
  ]);

  useEffect(() => {
    if (!addressBook || !transactions) return;
    setOurAssets(
      Object.keys(Assets)
        // TODO: the following line crashes the page when txns are cleared
        .filter(asset => transactions?.json?.some(hasAsset(asset)))
    );
  }, [addressBook, transactions]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const changeFilterSource = (event: React.ChangeEvent<{ value: string }>) => {
    setFilterSource(event.target.value);
  };

  const changeFilterAccount = (event: React.ChangeEvent<{ value: string }>) => {
    setFilterAccount(event.target.value);
  };

  const changeFilterAsset = (event: React.ChangeEvent<{ value: string }>) => {
    setFilterAsset(event.target.value);
  };

  const handleFileTypeChange = (event: React.ChangeEvent<{ value: boolean }>) => {
    console.log(`Setting file type based on event target:`, event.target);
    setImportFileType(event.target.value);
  };

  const resetTxns = () => {
    setTransactions([]);
    console.log(`Successfully cleared tx data from localstorage`);
  };

  const syncTxns = async () => {
    if (!axios.defaults.headers.common.authorization) {
      console.warn(`Auth header not set yet..`);
      return;
    }
    setSyncing(true);
    console.log(`Syncing eth transactions for ${addressBook.json.length} addresses..`);
    let n = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = (await axios.post("/api/transactions/eth", { addressBook: addressBook.json }));
        console.log(`attempt ${n++}:`, res);
        if (res.status === 200 && typeof res.data === "object") {
          console.log(`Successfully fetched ${res.data?.length || 0} transactions`, res.data);
          transactions.merge(res.data);
          setTransactions([...transactions.json]);
          setSyncing(false);
          break;
        } else {
          console.log(res.data);
        }
      } catch (e) {
        console.warn(e.message);
      }
      await new Promise(res => setTimeout(res, 10_000));
    }
  };

  const handleImport = (event: any) => {
    const file = event.target.files[0];
    console.log(`Importing file of type ${importFileType}`);
    if (!importFileType || !file) return;
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      try {
        const importedFile = reader.result as string;
        transactions.mergeCsv(importedFile, importFileType);
        setTransactions([...transactions.json]);
      } catch (e) {
        console.error(e);
      }
    };
  };

  return (
    <React.Fragment>

      <Typography variant="h3">
        Transaction Explorer
      </Typography>

      <Divider/>
      <Typography variant="h4" className={classes.subtitle}>
        Management
      </Typography>

      <Button
        className={classes.button}
        disabled={syncing}
        onClick={syncTxns}
        startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon/>}
        variant="outlined"
      >
        Sync Chain Data Transactions
      </Button>

      <Button
        className={classes.button}
        disabled={!transactions?.json.length}
        onClick={resetTxns}
        startIcon={<ClearIcon/>}
        variant="outlined"
      >
        Clear Transactions
      </Button>

      <FormControl className={classes.select}>
        <InputLabel id="select-file-type-label">File Type</InputLabel>
        <Select
          labelId="select-file-type-label"
          id="select-file-type"
          value={importFileType || ""}
          onChange={handleFileTypeChange}
        >
          <MenuItem value={""}>-</MenuItem>
          <MenuItem value={CsvSources.Coinbase}>{CsvSources.Coinbase}</MenuItem>
          <MenuItem value={CsvSources.DigitalOcean}>{CsvSources.DigitalOcean}</MenuItem>
          <MenuItem value={CsvSources.Wyre}>{CsvSources.Wyre}</MenuItem>
          <MenuItem value={CsvSources.Wazirx}>{CsvSources.Wazirx}</MenuItem>
        </Select>
      </FormControl>

      <input
        accept="text/csv"
        className={classes.importer}
        disabled={!importFileType}
        id="file-importer"
        onChange={handleImport}
        type="file"
      />

      <Divider/>
      <Typography variant="h4" className={classes.subtitle}>
        Filters
      </Typography>

      <FormControl className={classes.select}>
        <InputLabel id="select-filter-account">Filter Account</InputLabel>
        <Select
          labelId="select-filter-account"
          id="select-filter-account"
          value={filterAccount || ""}
          onChange={changeFilterAccount}
        >
          <MenuItem value={""}>-</MenuItem>
          {Object.values(addressBook?.json || [])
            .filter(account => account.category === AddressCategories.Self)
            // TODO: the following line crashes the page when txns are cleared
            // .filter(account => transactions?.some(hasAccount(account.address)))
            .map(account => (
              <MenuItem key={account.address} value={account.address}>{account.name}</MenuItem>
            ))
          };
        </Select>
      </FormControl>

      <FormControl className={classes.select}>
        <InputLabel id="select-filter-asset">Filter Asset</InputLabel>
        <Select
          labelId="select-filter-asset"
          id="select-filter-asset"
          value={filterAsset || ""}
          onChange={changeFilterAsset}
        >
          <MenuItem value={""}>-</MenuItem>
          {ourAssets.map(asset => (
            <MenuItem key={asset} value={asset}>{asset}</MenuItem>
          )) };
        </Select>
      </FormControl>

      <FormControl className={classes.select}>
        <InputLabel id="select-filter-source">Filter Source</InputLabel>
        <Select
          labelId="select-filter-source"
          id="select-filter-source"
          value={filterSource || ""}
          onChange={changeFilterSource}
        >
          <MenuItem value={""}>-</MenuItem>
          {Object.keys(TransactionSources)
            // TODO: the following line crashes the page when txns are cleared
            // .filter(source => transactions?.some(hasSource(source)))
            .map(source => (
              <MenuItem key={source} value={source}>{source}</MenuItem>
            ))
          };
        </Select>
      </FormControl>

      <InputDate
        label="Filter End Date"
        setDate={setFilterEndDate}
      />

      <InputDate
        label="Filter Start Date"
        setDate={setFilterStartDate}
      />

      <Paper className={classes.paper}>

        <Typography align="center" variant="h4" className={classes.title} component="div">
          {filteredTxns.length === transactions?.json.length
            ? `${filteredTxns.length} Transactions`
            : `${filteredTxns.length} of ${transactions?.json?.length} Transactions`
          }
        </Typography>

        <TableContainer>
          <TablePagination
            rowsPerPageOptions={[25, 50, 100, 250]}
            component="div"
            count={filteredTxns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong> Date </strong></TableCell>
                <TableCell><strong> Description </strong></TableCell>
                <TableCell><strong> Hash </strong></TableCell>
                <TableCell><strong> Sources </strong></TableCell>
                <TableCell><strong> Transfers </strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTxns
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tx: Transaction, i: number) => (
                  <TransactionRow addressBook={addressBook} key={i} tx={tx} />
                ))
              }
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[25, 50, 100, 250]}
            component="div"
            count={filteredTxns.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Paper>

    </React.Fragment>
  );
};
