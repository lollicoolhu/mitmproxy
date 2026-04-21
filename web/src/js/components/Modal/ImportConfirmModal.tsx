import * as React from "react";
import { useAppDispatch, useAppSelector } from "../../ducks";
import * as modalActions from "../../ducks/ui/modal";
import { fetchRules, setPendingImport } from "../../ducks/ui/intercept";
import { fetchApi } from "../../utils";

export default function ImportConfirmModal() {
    const dispatch = useAppDispatch();
    const file = useAppSelector(state => state.ui.intercept.pendingImportFile);

    if (!file) return null;

    const onImport = async (overwrite: boolean) => {
        try {
            const response = await fetchApi(`/intercept/rules/import?overwrite=${overwrite}`, {
                method: "POST",
                body: file,
            });
            if (response.ok) {
                dispatch(fetchRules());
            }
        } catch (err) {
            console.error(err);
        }
        dispatch(setPendingImport(undefined));
        dispatch(modalActions.hideModal());
    };

    return (
        <div className="import-confirm-modal">
            <div className="modal-header">
                <button
                    type="button"
                    className="close"
                    data-dismiss="modal"
                    onClick={() => dispatch(modalActions.hideModal())}
                >
                    &times;
                </button>
                <div className="modal-title">Import Intercept Rules</div>
            </div>
            <div className="modal-body">
                <p>Do you want to overwrite the current rules list or append the new rules?</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-danger" onClick={() => onImport(true)}>覆盖 (Overwrite)</button>
                <button className="btn btn-primary" onClick={() => onImport(false)}>追加 (Append)</button>
            </div>
        </div>
    );
}
