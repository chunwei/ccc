import {
  Cell,
  CellDep,
  CellDepLike,
  CellInput,
  CellInputLike,
  CellOutput,
  CellOutputLike,
  DepType,
  DepTypeLike,
  HashType,
  HashTypeLike,
  OutPoint,
  OutPointLike,
  Script,
  ScriptLike,
  Transaction,
  TransactionLike,
  depTypeFrom,
  hashTypeFrom,
} from "../../ckb/index.js";
import { Hex } from "../../hex/index.js";
import { NumLike, numFrom, numToHex } from "../../num/index.js";
import { apply } from "../../utils/index.js";
import {
  ClientFindCellsResponse,
  ClientFindTransactionsGroupedResponse,
  ClientFindTransactionsResponse,
  ClientIndexerSearchKey,
  ClientIndexerSearchKeyFilter,
  ClientIndexerSearchKeyLike,
  ClientIndexerSearchKeyTransaction,
  ClientIndexerSearchKeyTransactionLike,
  ClientTransactionResponse,
  TransactionStatus,
} from "../clientTypes.js";
import {
  JsonRpcCellDep,
  JsonRpcCellInput,
  JsonRpcCellOutput,
  JsonRpcDepType,
  JsonRpcHashType,
  JsonRpcIndexerFindTransactionsGroupedResponse,
  JsonRpcIndexerFindTransactionsResponse,
  JsonRpcIndexerSearchKey,
  JsonRpcIndexerSearchKeyFilter,
  JsonRpcIndexerSearchKeyTransaction,
  JsonRpcOutPoint,
  JsonRpcScript,
  JsonRpcTransaction,
} from "./types.js";

export class JsonRpcTransformers {
  static hashTypeFrom(hashType: HashTypeLike): JsonRpcHashType {
    return hashTypeFrom(hashType);
  }
  static hashTypeTo(hashType: JsonRpcHashType): HashType {
    return hashType;
  }
  static depTypeFrom(depType: DepTypeLike): JsonRpcDepType {
    switch (depTypeFrom(depType)) {
      case "code":
        return "code";
      case "depGroup":
        return "dep_group";
    }
  }
  static depTypeTo(depType: JsonRpcDepType): DepType {
    switch (depType) {
      case "code":
        return "code";
      case "dep_group":
        return "depGroup";
    }
  }
  static scriptFrom(scriptLike: ScriptLike): JsonRpcScript {
    const script = Script.from(scriptLike);
    return {
      code_hash: script.codeHash,
      hash_type: JsonRpcTransformers.hashTypeFrom(script.hashType),
      args: script.args,
    };
  }
  static scriptTo(script: JsonRpcScript): Script {
    return Script.from({
      codeHash: script.code_hash,
      hashType: JsonRpcTransformers.hashTypeTo(script.hash_type),
      args: script.args,
    });
  }
  static outPointFrom(outPointLike: OutPointLike): JsonRpcOutPoint {
    const outPoint = OutPoint.from(outPointLike);
    return {
      index: numToHex(outPoint.index),
      tx_hash: outPoint.txHash,
    };
  }
  static outPointTo(outPoint: JsonRpcOutPoint): OutPoint {
    return OutPoint.from({
      index: outPoint.index,
      txHash: outPoint.tx_hash,
    });
  }
  static cellInputFrom(cellInputLike: CellInputLike): JsonRpcCellInput {
    const cellInput = CellInput.from(cellInputLike);
    return {
      previous_output: JsonRpcTransformers.outPointFrom(
        cellInput.previousOutput,
      ),
      since: numToHex(cellInput.since),
    };
  }
  static cellInputTo(cellInput: JsonRpcCellInput): CellInput {
    return CellInput.from({
      previousOutput: JsonRpcTransformers.outPointTo(cellInput.previous_output),
      since: cellInput.since,
    });
  }
  static cellOutputFrom(cellOutput: CellOutputLike): JsonRpcCellOutput {
    return {
      capacity: numToHex(cellOutput.capacity),
      lock: JsonRpcTransformers.scriptFrom(cellOutput.lock),
      type: apply(JsonRpcTransformers.scriptFrom, cellOutput.type),
    };
  }
  static cellOutputTo(cellOutput: JsonRpcCellOutput): CellOutput {
    return CellOutput.from({
      capacity: cellOutput.capacity,
      lock: JsonRpcTransformers.scriptTo(cellOutput.lock),
      type: apply(JsonRpcTransformers.scriptTo, cellOutput.type),
    });
  }
  static cellDepFrom(cellDep: CellDepLike): JsonRpcCellDep {
    return {
      out_point: JsonRpcTransformers.outPointFrom(cellDep.outPoint),
      dep_type: JsonRpcTransformers.depTypeFrom(cellDep.depType),
    };
  }
  static cellDepTo(cellDep: JsonRpcCellDep): CellDep {
    return CellDep.from({
      outPoint: JsonRpcTransformers.outPointTo(cellDep.out_point),
      depType: JsonRpcTransformers.depTypeTo(cellDep.dep_type),
    });
  }
  static transactionFrom(txLike: TransactionLike): JsonRpcTransaction {
    const tx = Transaction.from(txLike);
    return {
      version: numToHex(tx.version),
      cell_deps: tx.cellDeps.map((c) => JsonRpcTransformers.cellDepFrom(c)),
      header_deps: tx.headerDeps,
      inputs: tx.inputs.map((i) => JsonRpcTransformers.cellInputFrom(i)),
      outputs: tx.outputs.map((o) => JsonRpcTransformers.cellOutputFrom(o)),
      outputs_data: tx.outputsData,
      witnesses: tx.witnesses,
    };
  }
  static transactionTo(tx: JsonRpcTransaction): Transaction {
    return Transaction.from({
      version: tx.version,
      cellDeps: tx.cell_deps.map((c) => JsonRpcTransformers.cellDepTo(c)),
      headerDeps: tx.header_deps,
      inputs: tx.inputs.map((i) => JsonRpcTransformers.cellInputTo(i)),
      outputs: tx.outputs.map((o) => JsonRpcTransformers.cellOutputTo(o)),
      outputsData: tx.outputs_data,
      witnesses: tx.witnesses,
    });
  }
  static transactionResponseTo({
    tx_status: { status },
    transaction,
  }: {
    tx_status: { status: TransactionStatus };
    transaction: JsonRpcTransaction | null;
  }): ClientTransactionResponse | null {
    if (transaction == null) {
      return null;
    }

    return {
      transaction: JsonRpcTransformers.transactionTo(transaction),
      status,
    };
  }
  static rangeFrom([a, b]: [NumLike, NumLike]): [Hex, Hex] {
    return [numToHex(a), numToHex(b)];
  }
  static indexerSearchKeyFilterFrom(
    filter: ClientIndexerSearchKeyFilter,
  ): JsonRpcIndexerSearchKeyFilter {
    return {
      script: apply(JsonRpcTransformers.scriptFrom, filter.script),
      script_len_range: apply(
        JsonRpcTransformers.rangeFrom,
        filter.scriptLenRange,
      ),
      output_data: filter.outputData,
      output_data_filter_mode: filter.outputDataSearchMode,
      output_data_len_range: apply(
        JsonRpcTransformers.rangeFrom,
        filter.outputDataLenRange,
      ),
      output_capacity_range: apply(
        JsonRpcTransformers.rangeFrom,
        filter.outputCapacityRange,
      ),
      block_range: apply(JsonRpcTransformers.rangeFrom, filter.blockRange),
    };
  }
  static indexerSearchKeyFrom(
    keyLike: ClientIndexerSearchKeyLike,
  ): JsonRpcIndexerSearchKey {
    const key = ClientIndexerSearchKey.from(keyLike);
    return {
      script: JsonRpcTransformers.scriptFrom(key.script),
      script_type: key.scriptType,
      script_search_mode: key.scriptSearchMode,
      filter: apply(JsonRpcTransformers.indexerSearchKeyFilterFrom, key.filter),
      with_data: key.withData,
    };
  }
  static findCellsResponseTo({
    last_cursor,
    objects,
  }: {
    last_cursor: string;
    objects: {
      out_point: JsonRpcOutPoint;
      output: JsonRpcCellOutput;
      output_data?: Hex;
    }[];
  }): ClientFindCellsResponse {
    return {
      lastCursor: last_cursor,
      cells: objects.map((cell) =>
        Cell.from({
          outPoint: JsonRpcTransformers.outPointTo(cell.out_point),
          cellOutput: JsonRpcTransformers.cellOutputTo(cell.output),
          outputData: cell.output_data ?? "0x",
        }),
      ),
    };
  }
  static indexerSearchKeyTransactionFrom(
    keyLike: ClientIndexerSearchKeyTransactionLike,
  ): JsonRpcIndexerSearchKeyTransaction {
    const key = ClientIndexerSearchKeyTransaction.from(keyLike);
    return {
      script: JsonRpcTransformers.scriptFrom(key.script),
      script_type: key.scriptType,
      script_search_mode: key.scriptSearchMode,
      filter: apply(JsonRpcTransformers.indexerSearchKeyFilterFrom, key.filter),
      group_by_transaction: key.groupByTransaction,
    };
  }
  static findTransactionsResponseTo({
    last_cursor,
    objects,
  }:
    | JsonRpcIndexerFindTransactionsResponse
    | JsonRpcIndexerFindTransactionsGroupedResponse):
    | ClientFindTransactionsResponse
    | ClientFindTransactionsGroupedResponse {
    if (objects.length === 0) {
      return {
        lastCursor: last_cursor,
        transactions: [],
      };
    }
    if ("io_index" in objects[0]) {
      return {
        lastCursor: last_cursor,
        transactions: (
          objects as JsonRpcIndexerFindTransactionsResponse["objects"]
        ).map((tx) => ({
          txHash: tx.tx_hash,
          blockNumber: numFrom(tx.block_number),
          txIndex: numFrom(tx.tx_index),
          cellIndex: numFrom(tx.io_index),
          isInput: tx.io_type === "input",
        })),
      };
    }

    return {
      lastCursor: last_cursor,
      transactions: (
        objects as JsonRpcIndexerFindTransactionsGroupedResponse["objects"]
      ).map((tx) => ({
        txHash: tx.tx_hash,
        blockNumber: numFrom(tx.block_number),
        txIndex: numFrom(tx.tx_index),
        cells: tx.cells.map(([type, i]) => ({
          isInput: type === "input",
          cellIndex: numFrom(i),
        })),
      })),
    };
  }
}
