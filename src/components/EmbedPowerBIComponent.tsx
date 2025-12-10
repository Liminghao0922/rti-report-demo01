/*
Copyright (c) Microsoft Corporation.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

import React, { useEffect, useState } from "react";
import { useMsal } from '@azure/msal-react';
import { models } from 'powerbi-client';
import { Report } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { setSelection } from '../state/slice/selectionSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from "../state/store";
import { powerBIFilterService } from '../service/PowerBIFilterService';


declare global {
  interface Window {
    report: Report | undefined;
  }
}

const EmbedPowerBIComponent: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const [isBusy, setBusy] = useState(true);
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const [token, setTokenVal] = useState<string | undefined>();
  const assetIds = useSelector((state: RootState) => state.selection.assetIds);

  const setPowerBIEmbededToken = async () => {
    const request = {
      scopes: [process.env.POWERBI_REQUEST_SCOPE],
      account: activeAccount
    };

    try {
      const authResult = await instance.acquireTokenSilent(request);
      setTokenVal(authResult.accessToken);
      setBusy(false);
    } catch (error) {
      console.error(error);
      setBusy(false);
    }
  };

  useEffect(() => {
    setBusy(true);
    setPowerBIEmbededToken();
  }, []);

  // Update Power BI slicer when selection changes
  useEffect(() => {
    if (!isBusy && window.report) {
      setSlicer();
    }
  }, [assetIds, isBusy]);


  const handleSetSelection = (assetId: string) => {
    let updatedSelection;

    if (assetIds.includes(assetId)) {
      updatedSelection = assetIds.filter(id => id !== assetId);
    } else {
      updatedSelection = [...assetIds, assetId];
    }
    dispatch(setSelection(updatedSelection));
  };

  // Transform asset IDs to Power BI column values
  const mapAssetIdsToPowerBIValues = (ids: string[]): string[] => {
    return ids.map(id => {
      // TODO: Add your specific transformation logic here
      // Currently returning the ID as is. 
      // Example: return id.split('/').pop() || id;
      return id;
    });
  };

  const basicFilter: models.IBasicFilter = {
    $schema: process.env.POWERBI_BASIC_FILTER_SCHEMA,
    target: {
      table: process.env.POWERBI_TABLE_NAME,
      column: process.env.POWERBI_TABLE_COLUMN_NAME
    },
    operator: "In",
    values: mapAssetIdsToPowerBIValues(assetIds),
    filterType: models.FilterType.Basic
  };

  const setSlicer = () => {
    if (window.report) {
      let report: Report = window.report
      report.getPages().then(pages => {
        pages[0].getVisuals().then(visuals => {
          for (let visual of visuals) {
            if (visual.type === 'slicer' && visual.name === process.env.POWERBI_VISUAL_ID) {
              if (basicFilter.values.length > 0) {
                visual.setSlicerState({ 'filters': [basicFilter] });
              } else {
                visual.setSlicerState({ 'filters': [] });
              }
            }
          }
        });
      });
      return "";
    }
  };

  return (
    <div>
      {setSlicer()}
      {isBusy ? (
        <div className="pbi-div">Loading</div>
      ) : (
        <div className="pbi-div">
          <PowerBIEmbed
            embedConfig={{
              type: 'report',
              id: process.env.POWERBI_REPORT_ID,
              embedUrl: process.env.POWERBI_EMBED_URL,
              accessToken: token || '',
              tokenType: models.TokenType.Aad,
              settings: {
                panes: {
                  filters: {
                    expanded: false,
                    visible: false
                  },
                  pageNavigation: {
                    visible: false
                  }
                },
                background: models.BackgroundType.Transparent,
              }
            }}
            eventHandlers={
              new Map([
                ['loaded', function () {
                  setSlicer();
                  let report: Report = window.report
                  // Initialize filter service for button interactions
                  if (report) {
                    powerBIFilterService.setReportInstance(report);
                  }
                  report?.on('visualClicked', async function () {
                    const pages = await report?.getPages();
                    const visuals = await pages?.[0].getVisuals();
                    if (visuals) {
                      for (let visual of visuals) {
                        if (visual.type === 'slicer' && visual.name === process.env.POWERBI_VISUAL_ID) {
                          const state = await visual.getSlicerState();
                          if (state.filters.length > 0) {
                            let filter = state.filters[0] as models.IBasicFilter;
                            filter.values.forEach(val => {
                              let v = val as string;
                              console.log(visual.name + " " + v) // <-- use this to get the .env POWERBI_VISUAL_ID of slicer
                              handleSetSelection(v);
                            });
                          }
                        }
                      }
                    }
                  });
                }],
                ['rendered', function () { console.log('Report rendered'); }],
                ['error', function (event) { console.log(event.detail); }],
              ])
            }
            cssClassName={"bi-embedded"}
            getEmbeddedComponent={(embeddedReport) => {
              window.report = embeddedReport as Report;
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EmbedPowerBIComponent;