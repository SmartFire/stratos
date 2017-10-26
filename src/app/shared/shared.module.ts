import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CoreModule } from '../core/core.module';
import { DisplayValueComponent } from './components/display-value/display-value.component';
import { EditableDisplayValueComponent } from './components/editable-display-value/editable-display-value.component';
import { LoadingPageComponent } from './components/loading-page/loading-page.component';
import { PageHeaderModule } from './components/page-header/page-header.module';
import { StatefulIconComponent } from './components/stateful-icon/stateful-icon.component';
import { SteppersModule } from './components/stepper/steppers.module';
import { MbToHumanSizePipe } from './pipes/mb-to-human-size.pipe';
import { DetailsCardComponent } from './components/details-card/details-card.component';
import { FocusDirective } from './components/focus.directive';
import { UniqueDirective } from './components/unique.directive';
import { ValuesPipe } from './pipes/values.pipe';
import { CodeBlockComponent } from './components/code-block/code-block.component';
import { TableComponent } from './components/table/table.component';
// import { TableColumnSelectComponent } from './components/table-column-select/table-column-select.component';
// import { TableColumnEditComponent } from './components/table-column-edit/table-column-edit.component';
import { TableCellComponent } from './components/table-cell/table-cell.component';
import { TableCellSelectComponent } from './components/table-cell-select/table-cell-select.component';
import { TableHeaderSelectComponent } from './components/table-header-select/table-header-select.component';
import { TableCellEditComponent } from './components/table-cell-edit/table-cell-edit.component';


@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    PageHeaderModule,
    RouterModule,
    SteppersModule
  ],
  declarations: [
    LoadingPageComponent,
    DisplayValueComponent,
    StatefulIconComponent,
    EditableDisplayValueComponent,
    MbToHumanSizePipe,
    ValuesPipe,
    LoadingPageComponent,
    DetailsCardComponent,
    FocusDirective,
    UniqueDirective,
    CodeBlockComponent,
    TableComponent,
    // TableColumnSelectComponent,
    // TableColumnEditComponent,
    TableCellComponent,
    TableCellSelectComponent,
    TableHeaderSelectComponent,
    TableCellEditComponent,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    LoadingPageComponent,
    PageHeaderModule,
    DisplayValueComponent,
    EditableDisplayValueComponent,
    DetailsCardComponent,
    SteppersModule,
    StatefulIconComponent,
    MbToHumanSizePipe,
    ValuesPipe,
    SteppersModule,
    FocusDirective,
    UniqueDirective,
    CodeBlockComponent,
    TableComponent,
    // TableColumnSelectComponent,
    // TableColumnEditComponent,
    TableCellSelectComponent,
  ],
})
export class SharedModule { }
