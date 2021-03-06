/*
Copyright (c) 2018 The Helm Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

import (
	"github.com/helm/monocular/chartrepo/foundationdb"

	log "github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
)

//DeleteCmd Delete a chart repository from Monocular
var DeleteCmd = &cobra.Command{
	Use:   "delete [REPO NAME]",
	Short: "delete a chart repository",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) != 1 {
			log.Info("Need exactly one argument: [REPO NAME]")
			cmd.Help()
			return
		}

		foundationdb.Delete(cmd, args)
	},
}
